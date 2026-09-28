import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 })

function createToken(userId: number) {
  const secret = process.env.JWT_SECRET || process.env.DATABASE_URL
  if (!secret) throw new Error('Database configuration is missing')
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url')
  return `${payload}.${crypto.createHmac('sha256', secret).update(payload).digest('base64url')}`
}

export async function POST(request: Request) {
  try {
    const { email: rawEmail, password } = await request.json()
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
    if (!email || typeof password !== 'string') return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })

    const result = await pool.query('SELECT id, email, name, role, company_id, admin_company_id, created_at, password FROM users WHERE email = $1 LIMIT 1', [email])
    const user = result.rows[0]
    if (!user || !(await bcrypt.compare(password, user.password))) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const { password: _password, ...safeUser } = user
    return NextResponse.json({ message: 'Login successful', user: safeUser, token: createToken(user.id) })
  } catch (error) {
    console.error('[auth/login]', error)
    return NextResponse.json({ error: 'Unable to sign in' }, { status: 500 })
  }
}
