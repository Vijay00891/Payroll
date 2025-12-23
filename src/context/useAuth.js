import { useContext } from 'react';
import AuthContext from './authCore';

export default function useAuth() {
  return useContext(AuthContext);
}