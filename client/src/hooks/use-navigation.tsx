
import { useLocation } from "wouter";

export function useNavigation() {
  const [, setLocation] = useLocation();
  
  const navigate = (path: string) => {
    setLocation(path);
  };

  return { navigate };
}
