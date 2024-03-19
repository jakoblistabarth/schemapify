import Link from "next/link";
import { ReactNode } from "react";
import { RiArrowLeftLine, RiGithubLine } from "react-icons/ri";
import Button from "../components/Button";
import Brand from "../components/Brand";

export default function MetaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl">
      <header className="my-5 flex justify-center">
        <Link href={"/"}>
          <Brand />
        </Link>
      </header>
      <main>{children}</main>
      <footer className="mt-5 flex flex-col gap-3">
        <Link href={"/"}>
          <Button primary>
            <RiArrowLeftLine /> Back
          </Button>
        </Link>
        <Link
          className="flex items-center"
          href={"https://github.com/jakoblistabarth/schemapify"}
        >
          <div className="mr-1">
            <RiGithubLine />
          </div>
          Github
        </Link>
      </footer>
    </div>
  );
}
