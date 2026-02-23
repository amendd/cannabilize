import 'next-auth';

declare module 'next-auth' {
  interface User {
    role: string;
    id: string;
    adminMenuPermissions?: string[];
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      adminMenuPermissions?: string[];
      doctorId?: string;
      rescheduleInvitesEnabled?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    id: string;
    adminMenuPermissions?: string[];
  }
}
