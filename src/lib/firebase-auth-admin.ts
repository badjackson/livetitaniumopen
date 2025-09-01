export interface JudgeAuthData {
  uid?: string;
  email: string;
  password: string;
  displayName: string;
  sector: string;
  role: 'judge' | 'admin';
  isActive: boolean;
}

export interface CreateUserResult {
  success: boolean;
  uid?: string;
  error?: string;
}

export interface UpdateUserResult {
  success: boolean;
  error?: string;
}

export interface DeleteUserResult {
  success: boolean;
  error?: string;
}

/**
 * Client-side wrapper for Firebase Auth Admin operations
 * Makes API calls to server-side endpoints that use Firebase Admin SDK
 */
export class FirebaseAuthAdmin {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/admin/auth';
  }

  /**
   * Create a new user with Firebase Auth Admin SDK
   */
  async createUser(userData: JudgeAuthData): Promise<CreateUserResult> {
    try {
      const response = await fetch(`${this.baseUrl}/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(uid: string, userData: Partial<JudgeAuthData>): Promise<UpdateUserResult> {
    try {
      const response = await fetch(`${this.baseUrl}/update-user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid, ...userData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(uid: string): Promise<DeleteUserResult> {
    try {
      const response = await fetch(`${this.baseUrl}/delete-user`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all users (judges)
   */
  async getUsers(): Promise<JudgeAuthData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/get-users`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.users || [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  /**
   * Set custom claims for a user
   */
  async setCustomClaims(uid: string, claims: Record<string, any>): Promise<UpdateUserResult> {
    try {
      const response = await fetch(`${this.baseUrl}/set-claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid, claims }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting custom claims:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}