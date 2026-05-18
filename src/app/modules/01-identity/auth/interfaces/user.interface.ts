// ─── Auth Interfaces ─────────────────────────────────────
// Contratos que reflejan EXACTAMENTE lo que el backend devuelve.
// Si el backend cambia su response, este es el ÚNICO lugar que se actualiza.

export interface User {
  id:            string;
  email:         string;
  fullName:      string;
  phone:         string | null;
  gender:        string | null;
  emailVerified: boolean;
  status:        string;
  roles:         string[];
  permissions:   string[];
}