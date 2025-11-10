"use client";

import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "../ui/empty";

type EmptyProps = {
  title: string;
}

const EmptyResults = ({title}: EmptyProps) => {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>This seems empty</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export default EmptyResults;