import React, { ReactElement } from 'react';
import { User } from "blaise-api-node-client";
interface AuthenticationProps {
    children: (user: User) => React.ReactNode;
}
export default function Authentication({ children }: AuthenticationProps): ReactElement;
export {};
