import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { mockUsers } from "@/lib/mock-data"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "trainee@forge.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null
        // Find user in mock data
        const user = mockUsers.find(u => u.email === credentials.email)
        
        if (user) {
          // In a real app we'd verify password hash here
          return { id: user.id, email: user.email, name: user.name, role: user.role }
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST }
