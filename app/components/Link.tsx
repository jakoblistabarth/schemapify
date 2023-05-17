import NextLink from "next/link";
import { FC } from "react";

type Props = React.PropsWithChildren<{
  href: string;
  description?: string;
}>;

const Link: FC<Props> = ({ href, children }) => {
  return (
    <NextLink href={href} className="no-underline">
      {children}
    </NextLink>
  );
};

export default Link;
