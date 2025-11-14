import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: string | undefined): string => {
  try {
    if(!date) return '';
    return format(date, 'dd MMM, y');
  } catch(e) {
    return '';
  }
}