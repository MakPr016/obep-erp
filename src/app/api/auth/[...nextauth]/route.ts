import type { NextRequest } from "next/server"
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcrypt"

interface User {
    id: string
    email: string
    name: string
    role: string
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

const authHandler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req): Promise<User | null> {
                const email = (credentials?.email ?? "") as string
                const password = (credentials?.password ?? "") as string
                if (!email || !password) return null

                const { data: user, error } = await supabase
                    .from("users")
                    .select("*")
                    .eq("email", email)
                    .single()

                console.log("Supabase user fetch result:", { user, error })

                if (error || !user) return null

                const hash = (user.password_hash ?? "") as string
                const isValid = await bcrypt.compare(password, hash)

                console.log("Password valid?", isValid)

                if (!isValid) return null

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                }
            }

        }),
    ],
    trustHost: true,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = (user as User).id
                token.role = (user as User).role
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
})

const { handlers } = authHandler as any
export const GET = handlers.GET
export const POST = handlers.POST
