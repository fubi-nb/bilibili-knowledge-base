import React from "react";
import { Card as UICard, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

type CardProps = {
  title: string;
  tags: string[];
  onClick?: () => void;
  children?: React.ReactNode;
};

export default function Card({ title, tags, onClick, children }: CardProps) {
  const Wrapper: any = onClick ? motion.button : motion.div;
  return (
    <Wrapper
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className="w-full text-left"
    >
      <UICard className={`hover:shadow-lg transition-shadow`}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-2">标签：{tags.join("、")}</div>
          {children}
        </CardContent>
      </UICard>
    </Wrapper>
  );
} 