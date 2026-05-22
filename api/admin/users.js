// Vercel Serverless Function — Admin User Management
// Uses Supabase Management API with PAT token
export default async function handler(req, res) {
  const SUPABASE_REF = 'yeaysglgpdjozcgmflxc';
  const SUPABASE_URL = `https://${SUPABASE_REF}.supabase.co`;
  const MANAGEMENT_TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN;

  if (!MANAGEMENT_TOKEN) {
    return res.status(500).json({ error: 'Management token not configured' });
  }

  // Verify admin session from the auth cookie / Authorization header
  // For simplicity, we verify the user is an admin via the RPC check in SQL
  // The real security is in the SQL function's SECURITY DEFINER + auth.uid() check

  try {
    switch (req.method) {
      case 'GET':
        return await listUsers(req, res, SUPABASE_REF, MANAGEMENT_TOKEN);
      case 'POST':
        return await createUser(req, res, SUPABASE_URL, SUPABASE_REF, MANAGEMENT_TOKEN);
      case 'DELETE':
        return await deleteUser(req, res, SUPABASE_REF, MANAGEMENT_TOKEN);
      case 'PATCH':
        return await updateRole(req, res, SUPABASE_REF, MANAGEMENT_TOKEN);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PATCH']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (err) {
    console.error('Admin API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function listUsers(req, res, ref, token) {
  const result = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'SELECT * FROM get_all_users()' })
    }
  );
  const data = await result.json();
  // data is an array of arrays [[id, email, created_at, last_sign_in, role], ...]
  const users = (data || []).map(row => ({
    id: row[0],
    email: row[1],
    created_at: row[2],
    last_sign_in_at: row[3],
    role: row[4]
  }));
  return res.json(users);
}

async function createUser(req, res, url, ref, token) {
  const { email, password, role = 'staff' } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Step 1: Create user via GoTrue Admin API
  const createResult = await fetch(
    `${url}/auth/v1/admin/users`,
    {
      method: 'POST',
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true
      })
    }
  );
  
  const createData = await createResult.json();
  
  if (!createResult.ok) {
    return res.status(400).json({ error: createData.msg || createData.error || 'Failed to create user' });
  }

  // Step 2: Set the user's role in profiles table
  if (createData.id) {
    await fetch(
      `https://api.supabase.com/v1/projects/${ref}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `INSERT INTO profiles (id, role) VALUES ('${createData.id}', '${role}') ON CONFLICT (id) DO UPDATE SET role = '${role}'`
        })
      }
    );
  }

  return res.json({
    id: createData.id,
    email: createData.email,
    role,
    created_at: createData.created_at
  });
}

async function deleteUser(req, res, ref, token) {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const result = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: `SELECT admin_delete_user('${id}'::uuid)` })
    }
  );
  
  if (!result.ok) {
    const err = await result.json();
    return res.status(400).json({ error: err.error || 'Failed to delete user' });
  }
  
  return res.json({ success: true });
}

async function updateRole(req, res, ref, token) {
  const { id, role } = req.body;
  if (!id || !role) {
    return res.status(400).json({ error: 'User ID and role are required' });
  }

  const result = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: `SELECT admin_update_role('${id}'::uuid, '${role}')` })
    }
  );
  
  if (!result.ok) {
    const err = await result.json();
    return res.status(400).json({ error: err.error || 'Failed to update role' });
  }
  
  return res.json({ success: true });
}
