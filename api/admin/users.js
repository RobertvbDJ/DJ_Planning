// Vercel Serverless Function — Admin User Management
// Uses Supabase Management API's database/query endpoint (via PAT token)
// Bypasses PostgREST RPC issues entirely

const SUPABASE_REF = 'yeaysglgpdjozcgmflxc';
const MGMT_API = 'https://api.supabase.com/v1';

export default async function handler(req, res) {
  const token = process.env.SUPABASE_MANAGEMENT_TOKEN;
  if (!token) return res.status(500).json({ error: 'Token not configured' });

  // Enable CORS for browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') return await listUsers(res, token);
    if (req.method === 'POST') return await createUser(req, res, token);
    if (req.method === 'DELETE') return await deleteUser(req, res, token);
    if (req.method === 'PATCH') return await updateRole(req, res, token);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function listUsers(res, token) {
  const result = await fetch(
    `${MGMT_API}/projects/${SUPABASE_REF}/database/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `SELECT u.id, u.email::text, u.created_at, u.last_sign_in_at::timestamptz,
                       COALESCE(p.role, 'staff')::text as role
                FROM auth.users u
                LEFT JOIN public.profiles p ON p.id = u.id
                ORDER BY u.created_at DESC`
      })
    }
  );
  const rows = await result.json();
  // rows is [[id,email,created_at,last_sign_in,role], ...] or {message: error}
  if (!Array.isArray(rows)) return res.json([]);
  const users = rows.map(r => ({
    id: r[0], email: r[1], created_at: r[2],
    last_sign_in_at: r[3], role: r[4]
  }));
  return res.json(users);
}

async function createUser(req, res, token) {
  const { email, password, role = 'staff' } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email en wachtwoord verplicht' });

  // Hash password using PostgreSQL pgcrypto
  const hashResult = await fetch(
    `${MGMT_API}/projects/${SUPABASE_REF}/database/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `SELECT crypt('${password.replace(/'/g, "''")}', gen_salt('bf')) as hash;` })
    }
  );
  const hashData = await hashResult.json();
  const hashedPw = hashData?.[0]?.hash;
  if (!hashedPw) return res.status(500).json({ error: 'Wachtwoord hashen mislukt' });

  // Create the user and identity in one go
  const createResult = await fetch(
    `${MGMT_API}/projects/${SUPABASE_REF}/database/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          DO $$
          DECLARE
            new_id uuid := gen_random_uuid();
          BEGIN
            INSERT INTO auth.users (id, instance_id, email, encrypted_password,
              email_confirmed_at, confirmation_sent_at, raw_app_meta_data, raw_user_meta_data,
              created_at, updated_at, aud, role)
            VALUES (new_id, '00000000-0000-0000-0000-000000000000',
              '${email.replace(/'/g, "''")}', '${hashedPw.replace(/'/g, "''")}',
              now(), now(),
              '{"provider":"email","providers":["email"]}', '{}',
              now(), now(), 'authenticated', 'authenticated');

            INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id,
              last_sign_in_at, created_at, updated_at)
            VALUES (new_id, new_id,
              jsonb_build_object('sub', new_id::text, 'email', '${email.replace(/'/g, "''")}'),
              'email', new_id::text, now(), now(), now());

            INSERT INTO public.profiles (id, role)
            VALUES (new_id, '${role}')
            ON CONFLICT (id) DO UPDATE SET role = '${role}';
          END $$;
        `
      })
    }
  );
  const createData = await createResult.json();
  if (!createResult.ok) return res.status(400).json({ error: String(createData) });

  return res.json({ success: true, email, role });
}

async function deleteUser(req, res, token) {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Gebruiker ID verplicht' });

  // Delete profiles first (foreign keys), then user (cascades to identities)
  await fetch(`${MGMT_API}/projects/${SUPABASE_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `DELETE FROM public.profiles WHERE id = '${id}'::uuid;` })
  });

  const result = await fetch(`${MGMT_API}/projects/${SUPABASE_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `DELETE FROM auth.users WHERE id = '${id}'::uuid;` })
  });
  if (!result.ok) return res.status(400).json({ error: 'Verwijderen mislukt' });
  return res.json({ success: true });
}

async function updateRole(req, res, token) {
  const { id, role } = req.body;
  if (!id || !role) return res.status(400).json({ error: 'Gebruiker ID en rol verplicht' });

  await fetch(`${MGMT_API}/projects/${SUPABASE_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `INSERT INTO public.profiles (id, role) VALUES ('${id}'::uuid, '${role}')
              ON CONFLICT (id) DO UPDATE SET role = '${role}';`
    })
  });
  return res.json({ success: true });
}
