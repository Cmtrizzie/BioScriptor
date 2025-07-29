import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, Settings, Shield, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left side - Menu button */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Center - Logo/Title */}
      <div className="flex-1 flex justify-center lg:justify-start lg:ml-4">
        <h1 className="text-lg font-semibold text-gray-900">BioScriptor</h1>
      </div>

      {/* Right side - Optional space for future features */}
      <div className="flex items-center space-x-4">
        {/* Space reserved for future header items */}
      </div>
    </header>
  );
}