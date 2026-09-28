'use client';

import { Accordion } from '@base-ui/react/accordion';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <Accordion.Root className="flex flex-col gap-space-md">
      {items.map((item) => (
        <Accordion.Item
          key={item.question}
          className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg"
        >
          <Accordion.Header render={<h2 />}>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-space-md text-left font-title-md text-title-md text-on-surface">
              {item.question}
              <span aria-hidden="true" className="shrink-0 transition-transform group-data-[panel-open]:rotate-45">
                +
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="font-body-sm text-body-sm text-on-surface-variant pt-space-xs">
            {item.answer}
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
