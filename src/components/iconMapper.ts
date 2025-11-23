/**
 * Mapper pour convertir les noms d'icônes (strings) en composants Lucide React
 */

import {
  Target, Search, TrendingUp, MapPin, Globe, Camera, Users, Link2, Mail,
  Rocket, Zap, Settings, Sparkles, Award, Star, ShoppingCart, Video,
  FileText, Calendar, Film, Check, Shield, BarChart3, MessageSquare,
  Brain, DollarSign, Phone, CheckCircle, Eye, EyeOff, Heart, type LucideIcon
} from 'lucide-react'

// Map des icônes disponibles
export const iconMap: Record<string, LucideIcon> = {
  Target,
  Search,
  TrendingUp,
  MapPin,
  Globe,
  Camera,
  Users,
  Link2,
  Mail,
  Rocket,
  Zap,
  Settings,
  Sparkles,
  Award,
  Star,
  ShoppingCart,
  Video,
  FileText,
  Calendar,
  Film,
  Check,
  Shield,
  BarChart3,
  MessageSquare,
  Brain,
  DollarSign,
  Phone,
  CheckCircle,
  Eye,
  EyeOff,
  Heart,
}

/**
 * Récupère un composant icône à partir de son nom
 * @param iconName - Nom de l'icône (ex: "Rocket", "Target")
 * @returns Le composant Lucide React correspondant
 */
export function getIcon(iconName: string): LucideIcon {
  const icon = iconMap[iconName]
  if (!icon) {
    console.warn(`Icon "${iconName}" not found in iconMap. Using Target as fallback.`)
    return Target // Fallback icon
  }
  return icon
}

/**
 * Vérifie si un nom d'icône existe dans le mapper
 */
export function hasIcon(iconName: string): boolean {
  return iconName in iconMap
}
