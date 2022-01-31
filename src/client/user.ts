import axios from "axios";
import { User } from "blaise-api-node-client";

export async function getUser(username: string): Promise<User> {
  const response = await axios.get(`/api/users/${username}`);

  return response.data;
}

export async function validatePassword(form: Record<string, string>): Promise<boolean> {
  const formData = new FormData();
  formData.append("username", form.Username);
  formData.append("password", form.Password);
  const response = await axios.post("/api/users/password/validate", formData);

  return response.data;
}
