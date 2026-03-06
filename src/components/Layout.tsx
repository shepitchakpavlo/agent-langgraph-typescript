import React from "react";
import { Text, Newline } from "ink";

interface LayoutProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Layout({ header, children, footer }: LayoutProps) {
  return (
    <>
      {header && (
        <>
          {header}
          <Newline count={1} />
        </>
      )}
      {children}
      {footer && (
        <>
          <Newline count={1} />
          {footer}
        </>
      )}
    </>
  );
}