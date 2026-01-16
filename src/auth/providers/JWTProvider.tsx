import axios, { AxiosResponse } from 'axios';
import React, {
  createContext,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
  PropsWithChildren
} from 'react';
import { AuthModel } from '../_models';
import * as authHelper from '../_helpers';

interface AuthContextProps {
  isLoading: boolean;
  auth: AuthModel | undefined;
  persona: any | undefined;
  setPersona: Dispatch<SetStateAction<any | undefined>>;
  empresa: any | undefined;
  setEmpresa: Dispatch<SetStateAction<any | undefined>>;
  user: any | undefined;
  setUser: Dispatch<SetStateAction<any | undefined>>;
  permissions: string;
  setPermissions: Dispatch<SetStateAction<string>>;
  getUserAuthenticated: () => Promise<void>;
  logout: () => void;
  login: (email: string, password: string, device_token:string) => Promise<void>;
  verify: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

const AuthProvider = ({ children }: PropsWithChildren) => {
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState<any | undefined>(null);
  const [empresa, setEmpresa] = useState<any | undefined>(null);
  const [permissions, setPermissions] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [auth, setAuth] = useState<AuthModel | undefined>(authHelper.getAuth());

  const verify = async () => {
    if (auth) {
      try {
        await getUserAuthenticated();
      } catch (error) {
        saveAuth(undefined);
      }
    }
  };

  useEffect(() => {
    verify().finally(() => {
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAuth = (auth: any | undefined) => {
    setAuth(auth);
    if (auth) {
      authHelper.setAuth(auth);
    } else {
      authHelper.removeAuth();
    }
  };

  const login = async (email: string, password: string, deviceToken: string) => {
    try {
      const response = await axios.post<any>(`login`, {
        email,
        password,
        device_token: deviceToken
      });
      saveAuth(response.data.access_token);
      // axios.post('login_factus').catch(err => console.warn('Error login_factus', err));
      // axios.post('refesh_token_factus').catch(err => console.warn('Error refresh_token_factus', err));
      await getUserAuthenticated();
    } catch (error) {
      throw new Error(`Login error: ${error}`);
    }
  };

  const selectCompany = async () => {
    try {
      const response = await axios.post<any>(`set_company`);
      setPermissions(response.data.payload.permissions);
    } catch (error) {
      saveAuth(undefined);

      throw new Error(`Error fetching user: ${error}`);
    }
  };

  const getUserAuthenticated = async () => {
    try {
      const response = await axios.post<any>(`user`);
      const auth = response.data;

      await selectCompany();
      await getActiveUser();

      setPersona(auth.persona);
      setUser(auth);
    } catch (error) {
      saveAuth(undefined);
      console.error(`Error fetching authenticated user: ${error}`);
      logout();
    }
  };

  const getActiveUser = async () => {
    try {
      const response = await axios.post<any>(`active_users`);
    
      if (Array.isArray(response.data) && response.data.length > 0) {
        setEmpresa(response.data[0].company);
      }
    } catch (error) {
      console.error(`Error fetching authenticated user: ${error}`);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`logout`);
      setUser(undefined);
      saveAuth(undefined);
      setPersona(undefined);
      setEmpresa(undefined);
      setPermissions('');
    } catch (error) {
      console.error(`Logout error: ${error}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading: loading,
        auth,
        persona,
        setPersona,
        empresa,
        setEmpresa,
        permissions,
        setPermissions,
        user,
        setUser,
        getUserAuthenticated,
        login,
        verify,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
