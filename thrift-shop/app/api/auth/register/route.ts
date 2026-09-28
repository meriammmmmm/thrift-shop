import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
})

function createToken(userId: number) {
  const secret = process.env.JWT_SECRET || process.env.DATABASE_URL
  if (!secret) throw new Error('Database configuration is missing')
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const name = typeof body.name === 'string' ? body.name.trim() : null
    const info = body.userInfo ?? {}

    if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email])
    if (existing.rowCount) return NextResponse.json({ error: 'User already exists' }, { status: 409 })

    const hashedPassword = await bcrypt.hash(password, 12)
    const userResult = await pool.query(
      'INSERT INTO users (email, password, name, company_id) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, company_id, admin_company_id, created_at',
      [email, hashedPassword, name || info.fullName || null, body.companyId || null],
    )
    const user = userResult.rows[0]

    if (body.userInfo) {
      await pool.query(
        `INSERT INTO user_info (user_id, full_name, email, phone, optional_phone, address, city, state, zip_code, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, phone = EXCLUDED.phone,
         optional_phone = EXCLUDED.optional_phone, address = EXCLUDED.address, city = EXCLUDED.city, state = EXCLUDED.state,
         zip_code = EXCLUDED.zip_code, country = EXCLUDED.country`,
        [user.id, info.fullName || name || '', email, info.phone || '', info.optionalPhone || '', info.address || '', info.city || '', info.state || '', info.zipCode || '', info.country || 'Tunisia'],
      )
    }

    return NextResponse.json({ message: 'User created successfully', user, token: createToken(user.id) }, { status: 201 })
  } catch (error) {
    console.error('[auth/register]', error)
    return NextResponse.json({ error: 'Unable to create account' }, { status: 500 })
  }
}
