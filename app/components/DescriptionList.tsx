import { FC, PropsWithChildren } from "react";

const DescriptionList: FC<PropsWithChildren> = ({ children }) => {
  return (
    <dl className="mb-5 grid grid-cols-[minmax(min-content,_1fr)_3fr] gap-2">
      {children}
    </dl>
  );
};

export default DescriptionList;
