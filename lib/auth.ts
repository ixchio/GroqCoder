/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/models/User";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      bio?: string;
      linkedinUrl?: string;
      githubUsername?: string;
    };
  }
  interface User {
    id: string;
    bio?: string;
    linkedinUrl?: string;
    githubUsername?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    bio?: string;
    linkedinUrl?: string;
    githubUsername?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // GitHub OAuth Provider
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    // Email/Password Provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectToDatabase();

        const user = await UserModel.findOne({ email: credentials.email });

        if (!user) {
          throw new Error("No user found with this email");
        }

        if (!user.password) {
          throw new Error("Please sign in with GitHub");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          bio: user.bio,
          linkedinUrl: user.linkedinUrl,
          githubUsername: user.githubUsername,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        await connectToDatabase();

        // Check if user exists
        let existingUser = await UserModel.findOne({
          $or: [
            { githubId: account.providerAccountId },
            { email: user.email },
          ],
        });

        if (!existingUser) {
          // Create new user from GitHub
          existingUser = await UserModel.create({
            email: user.email,
            name: user.name || (profile as any)?.login || "GitHub User",
            image: user.image,
            githubId: account.providerAccountId,
            githubUsername: (profile as any)?.login,
          });
        } else {
          // Update existing user with GitHub info
          existingUser.githubId = account.providerAccountId;
          existingUser.githubUsername = (profile as any)?.login;
          if (!existingUser.image && user.image) {
            existingUser.image = user.image;
          }
          await existingUser.save();
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.bio = user.bio;
        token.linkedinUrl = user.linkedinUrl;
        token.githubUsername = user.githubUsername;
      }

      // Fetch latest user data on each request
      if (token.email) {
        await connectToDatabase();
        const dbUser = await UserModel.findOne({ email: token.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.bio = dbUser.bio;
          token.linkedinUrl = dbUser.linkedinUrl;
          token.githubUsername = dbUser.githubUsername;
          token.picture = dbUser.image;
          token.name = dbUser.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.bio = token.bio;
        session.user.linkedinUrl = token.linkedinUrl;
        session.user.githubUsername = token.githubUsername;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
