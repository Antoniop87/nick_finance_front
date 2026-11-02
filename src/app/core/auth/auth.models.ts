/** Corpo de `POST /users/login`. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Resposta de `POST /users/login`. */
export interface LoginResponse {
  token: string;
  id: number;
  nome: string;
  sobrenome: string;
}

/** Corpo de `POST /users`. */
export interface RegisterRequest {
  nome: string;
  sobrenome: string;
  email: string;
  password: string;
  /** Formato `yyyy-MM-dd`. */
  dataNascimento: string;
}

/** Sessão do usuário autenticado, persistida no navegador. */
export interface Session {
  token: string;
  /** Instante de expiração do token, em milissegundos. */
  expiresAt: number;
  user: AuthUser;
}

export interface AuthUser {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
}
