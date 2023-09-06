import { User } from "blaise-api-node-client";
import React, { ReactElement } from "react";
interface AuthenticationProps {
    children: (user: User) => React.ReactNode;
}
export default function Authentication({ children }: AuthenticationProps): ReactElement;
export {};
