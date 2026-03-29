"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";

type StickerReport = {
  id: string;
  image_path: string;
  lat: number;
  lng: number;
  captured_at: string | null;
  upvotes?: number;
  downvotes?: number;
  uploaded_by?: string;
  last_status?: "seen" | "removed" | null;
  last_status_at?: string | null;
};

type StickerWithLocation = StickerReport & {
  country?: string;
  address?: string;
  city?: string;
  cap?: string;
  status: "pending" | "approved" | "rejected";
  upvotes: number;
  downvotes: number;
  uploaded_by?: string;
};

type GroupedStickers = {
  [country: string]: StickerWithLocation[];
};

type VoteChoice = "upvote" | "downvote" | null;
type StickerStatus = "seen" | "removed";
type SessionStatusUpdate = {
  status: StickerStatus;
  at: string;
};

// Function to get flag colors gradient for glass effect
function getFlagGradient(country: string): string {
  const gradients: { [key: string]: string } = {
    Afghanistan: "linear-gradient(90deg, #000 0%, #000 33%, #CE1126 33%, #CE1126 66%, #007C5E 66%, #007C5E 100%)",
    Albania: "linear-gradient(90deg, #CE1126 0%, #000 50%, #CE1126 100%)",
    Algeria: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Andorra: "linear-gradient(90deg, #002395 0%, #002395 33%, #ffc400 33%, #ffc400 66%, #ce1126 66%, #ce1126 100%)",
    Angola: "linear-gradient(90deg, #000 0%, #000 50%, #ce1126 50%, #ce1126 100%)",
    "Antigua and Barbuda": "linear-gradient(45deg, #000 0%, #000 25%, #ce1126 25%, #ce1126 50%, #ffc72c 50%, #ffc72c 100%)",
    Argentina: "linear-gradient(90deg, #4b96d6 0%, #4b96d6 33%, #fff 33%, #fff 66%, #4b96d6 66%, #4b96d6 100%)",
    Armenia: "linear-gradient(90deg, #d90012 0%, #d90012 33%, #0033a0 33%, #0033a0 66%, #f3d857 66%, #f3d857 100%)",
    Australia: "linear-gradient(90deg, #00008b 0%, #00008b 100%)",
    Austria: "linear-gradient(90deg, #ed2939 0%, #ed2939 33%, #fff 33%, #fff 66%, #ed2939 66%, #ed2939 100%)",
    Azerbaijan: "linear-gradient(90deg, #3f9647 0%, #3f9647 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Bahamas: "linear-gradient(45deg, #1a4686 0%, #1a4686 33%, #ffc72c 33%, #ffc72c 66%, #1a4686 66%, #1a4686 100%)",
    Bahrain: "linear-gradient(90deg, #fff 0%, #fff 25%, #ce1126 25%, #ce1126 100%)",
    Bangladesh: "linear-gradient(90deg, #006c35 0%, #006c35 50%, #f42a41 50%, #f42a41 100%)",
    Barbados: "linear-gradient(45deg, #fcd116 0%, #fcd116 33%, #000 33%, #000 66%, #ce1126 66%, #ce1126 100%)",
    Belarus: "linear-gradient(90deg, #ce1126 0%, #ce1126 50%, #fff 50%, #fff 100%)",
    Belgium: "linear-gradient(90deg, #000 0%, #000 33%, #ffc72c 33%, #ffc72c 66%, #ce1126 66%, #ce1126 100%)",
    Belize: "linear-gradient(90deg, #ce1126 0%, #ce1126 20%, #fff 20%, #fff 25%, #00008b 25%, #00008b 100%)",
    Benin: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #ffc72c 33%, #ffc72c 66%, #ce1126 66%, #ce1126 100%)",
    Bhutan: "linear-gradient(90deg, #f39c12 0%, #f39c12 50%, #000 50%, #000 100%)",
    Bolivia: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #ffc72c 33%, #ffc72c 66%, #007c5e 66%, #007c5e 100%)",
    "Bosnia and Herzegovina": "linear-gradient(45deg, #002395 0%, #002395 50%, #ffc72c 50%, #ffc72c 100%)",
    Botswana: "linear-gradient(90deg, #004b87 0%, #004b87 30%, #fff 30%, #fff 40%, #004b87 40%, #004b87 100%)",
    Brazil: "linear-gradient(45deg, #002776 0%, #002776 50%, #ffc72c 50%, #ffc72c 100%)",
    Brunei: "linear-gradient(90deg, #ffc72c 0%, #ffc72c 50%, #fff 50%, #fff 100%)",
    Bulgaria: "linear-gradient(90deg, #fff 0%, #fff 33%, #00966e 33%, #00966e 66%, #d62612 66%, #d62612 100%)",
    "Burkina Faso": "linear-gradient(90deg, #ce1126 0%, #ce1126 50%, #007c5e 50%, #007c5e 100%)",
    Burundi: "linear-gradient(45deg, #ce1126 0%, #ce1126 35%, #fff 35%, #fff 40%, #007c5e 40%, #007c5e 100%)",
    "Côte d'Ivoire": "linear-gradient(90deg, #f77f00 0%, #f77f00 33%, #fff 33%, #fff 66%, #007c5e 66%, #007c5e 100%)",
    "Cabo Verde": "linear-gradient(90deg, #003da5 0%, #003da5 40%, #fff 40%, #fff 45%, #007c5e 45%, #007c5e 100%)",
    Cambodia: "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Cameroon: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #ce1126 33%, #ce1126 66%, #ffc72c 66%, #ffc72c 100%)",
    Canada: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    "Central African Republic": "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Chad: "linear-gradient(90deg, #002395 0%, #002395 33%, #ffc72c 33%, #ffc72c 66%, #ce1126 66%, #ce1126 100%)",
    Chile: "linear-gradient(90deg, #fff 0%, #fff 50%, #ce1126 50%, #ce1126 100%)",
    China: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Colombia: "linear-gradient(90deg, #ffc72c 0%, #ffc72c 50%, #002395 50%, #002395 100%)",
    Comoros: "linear-gradient(45deg, #007c5e 0%, #007c5e 33%, #ffc72c 33%, #ffc72c 66%, #ce1126 66%, #ce1126 100%)",
    "Congo (Brazzaville)": "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #ffc72c 33%, #ffc72c 66%, #ce1126 66%, #ce1126 100%)",
    "Congo (Kinshasa)": "linear-gradient(90deg, #002395 0%, #002395 50%, #ce1126 50%, #ce1126 100%)",
    "Costa Rica": "linear-gradient(90deg, #002395 0%, #002395 25%, #fff 25%, #fff 50%, #ce1126 50%, #ce1126 100%)",
    Croatia: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #fff 33%, #fff 66%, #002395 66%, #002395 100%)",
    Cuba: "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Cyprus: "linear-gradient(90deg, #fff 0%, #fff 50%, #f77f00 50%, #f77f00 100%)",
    "Czech Republic": "linear-gradient(90deg, #fff 0%, #fff 33%, #ce1126 33%, #ce1126 66%, #002395 66%, #002395 100%)",
    Denmark: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Djibouti: "linear-gradient(90deg, #6fa6d6 0%, #6fa6d6 33%, #fff 33%, #fff 66%, #007c5e 66%, #007c5e 100%)",
    Dominica: "linear-gradient(45deg, #007c5e 0%, #007c5e 33%, #ffc72c 33%, #ffc72c 66%, #000 66%, #000 100%)",
    "Dominican Republic": "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Ecuador: "linear-gradient(90deg, #ffc72c 0%, #ffc72c 50%, #002395 50%, #002395 100%)",
    Egypt: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #fff 33%, #fff 66%, #000 66%, #000 100%)",
    "El Salvador": "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #002395 66%, #002395 100%)",
    "Equatorial Guinea": "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Eritrea: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #ce1126 33%, #ce1126 66%, #ffc72c 66%, #ffc72c 100%)",
    Estonia: "linear-gradient(90deg, #002395 0%, #002395 33%, #000 33%, #000 66%, #fff 66%, #fff 100%)",
    Eswatini: "linear-gradient(90deg, #00008b 0%, #00008b 25%, #ffc72c 25%, #ffc72c 50%, #ce1126 50%, #ce1126 100%)",
    Ethiopia: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #ffc72c 33%, #ffc72c 66%, #007c5e 66%, #007c5e 100%)",
    Fiji: "linear-gradient(90deg, #6fa6d6 0%, #6fa6d6 100%)",
    Finland: "linear-gradient(90deg, #fff 0%, #fff 35%, #002395 35%, #002395 65%, #fff 65%, #fff 100%)",
    France: "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Gabon: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #ffc72c 33%, #ffc72c 66%, #ce1126 66%, #ce1126 100%)",
    Gambia: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #fff 33%, #fff 66%, #007c5e 66%, #007c5e 100%)",
    Georgia: "linear-gradient(90deg, #fff 0%, #fff 100%)",
    Germany: "linear-gradient(90deg, #000 0%, #000 33%, #ce1126 33%, #ce1126 66%, #ffc72c 66%, #ffc72c 100%)",
    Ghana: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #ffc72c 33%, #ffc72c 66%, #007c5e 66%, #007c5e 100%)",
    Greece: "linear-gradient(90deg, #002395 0%, #002395 100%)",
    Grenada: "linear-gradient(45deg, #ce1126 0%, #ce1126 33%, #ffc72c 33%, #ffc72c 66%, #007c5e 66%, #007c5e 100%)",
    Guatemala: "linear-gradient(90deg, #6fa6d6 0%, #6fa6d6 33%, #fff 33%, #fff 66%, #6fa6d6 66%, #6fa6d6 100%)",
    Guinea: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #ffc72c 33%, #ffc72c 66%, #007c5e 66%, #007c5e 100%)",
    "Guinea-Bissau": "linear-gradient(45deg, #ce1126 0%, #ce1126 33%, #ffc72c 33%, #ffc72c 66%, #007c5e 66%, #007c5e 100%)",
    Guyana: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #fff 33%, #fff 66%, #000 66%, #000 100%)",
    Haiti: "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Honduras: "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #002395 66%, #002395 100%)",
    Hungary: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #fff 33%, #fff 66%, #007c5e 66%, #007c5e 100%)",
    Iceland: "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    India: "linear-gradient(90deg, #f77f00 0%, #f77f00 33%, #fff 33%, #fff 66%, #007c5e 66%, #007c5e 100%)",
    Indonesia: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Iran: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Iraq: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #fff 33%, #fff 66%, #000 66%, #000 100%)",
    Ireland: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #fff 33%, #fff 66%, #f77f00 66%, #f77f00 100%)",
    Israel: "linear-gradient(90deg, #002395 0%, #002395 100%)",
    Italy: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Jamaica: "linear-gradient(45deg, #007c5e 0%, #007c5e 50%, #ffc72c 50%, #ffc72c 100%)",
    Japan: "linear-gradient(90deg, #fff 0%, #fff 100%)",
    Jordan: "linear-gradient(90deg, #000 0%, #000 33%, #fff 33%, #fff 66%, #007c5e 66%, #007c5e 100%)",
    Kazakhstan: "linear-gradient(90deg, #00afca 0%, #00afca 100%)",
    Kenya: "linear-gradient(90deg, #000 0%, #000 33%, #ce1126 33%, #ce1126 66%, #fff 66%, #fff 100%)",
    Kiribati: "linear-gradient(90deg, #ce1126 0%, #ce1126 50%, #ffc72c 50%, #ffc72c 100%)",
    Kuwait: "linear-gradient(90deg, #000 0%, #000 25%, #fff 25%, #fff 50%, #007c5e 50%, #007c5e 100%)",
    Kyrgyzstan: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Laos: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #002395 33%, #002395 66%, #fff 66%, #fff 100%)",
    Latvia: "linear-gradient(90deg, #9d1d34 0%, #9d1d34 100%)",
    Lebanon: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Lesotho: "linear-gradient(45deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #007c5e 66%, #007c5e 100%)",
    Liberia: "linear-gradient(90deg, #ce1126 0%, #ce1126 11%, #fff 11%, #fff 22%, #002395 22%, #002395 33%, #fff 33%, #fff 44%, #ce1126 44%, #ce1126 100%)",
    Libya: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #000 33%, #000 66%, #007c5e 66%, #007c5e 100%)",
    Liechtenstein: "linear-gradient(90deg, #002395 0%, #002395 33%, #ce1126 33%, #ce1126 66%, #ffc72c 66%, #ffc72c 100%)",
    Lithuania: "linear-gradient(90deg, #ffc72c 0%, #ffc72c 33%, #007c5e 33%, #007c5e 66%, #ce1126 66%, #ce1126 100%)",
    Luxembourg: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #fff 33%, #fff 66%, #002395 66%, #002395 100%)",
    Madagascar: "linear-gradient(90deg, #fff 0%, #fff 33%, #ce1126 33%, #ce1126 66%, #007c5e 66%, #007c5e 100%)",
    Malawi: "linear-gradient(90deg, #000 0%, #000 33%, #ce1126 33%, #ce1126 66%, #007c5e 66%, #007c5e 100%)",
    Malaysia: "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Maldives: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Mali: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #ffc72c 33%, #ffc72c 66%, #ce1126 66%, #ce1126 100%)",
    Malta: "linear-gradient(90deg, #fff 0%, #fff 33%, #ce1126 33%, #ce1126 66%, #ce1126 66%, #ce1126 100%)",
    "Marshall Islands": "linear-gradient(45deg, #002395 0%, #002395 50%, #fff 50%, #fff 100%)",
    Mauritania: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #ffc72c 33%, #ffc72c 66%, #ce1126 66%, #ce1126 100%)",
    Mauritius: "linear-gradient(90deg, #ce1126 0%, #ce1126 25%, #002395 25%, #002395 50%, #ffc72c 50%, #ffc72c 100%)",
    Mexico: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Micronesia: "linear-gradient(45deg, #002395 0%, #002395 100%)",
    Moldova: "linear-gradient(90deg, #002395 0%, #002395 33%, #ffc72c 33%, #ffc72c 66%, #ce1126 66%, #ce1126 100%)",
    Monaco: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Mongolia: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #002395 33%, #002395 66%, #ce1126 66%, #ce1126 100%)",
    Montenegro: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Morocco: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Mozambique: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #000 33%, #000 66%, #ffc72c 66%, #ffc72c 100%)",
    Myanmar: "linear-gradient(90deg, #ffc72c 0%, #ffc72c 33%, #007c5e 33%, #007c5e 66%, #ce1126 66%, #ce1126 100%)",
    Namibia: "linear-gradient(45deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #007c5e 66%, #007c5e 100%)",
    Nauru: "linear-gradient(45deg, #002395 0%, #002395 50%, #ffc72c 50%, #ffc72c 100%)",
    Nepal: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #002395 33%, #002395 66%, #fff 66%, #fff 100%)",
    Netherlands: "linear-gradient(90deg, #ae1c28 0%, #ae1c28 33%, #fff 33%, #fff 66%, #21468b 66%, #21468b 100%)",
    "The Netherlands": "linear-gradient(90deg, #ae1c28 0%, #ae1c28 33%, #fff 33%, #fff 66%, #21468b 66%, #21468b 100%)",
    "Paesi Bassi": "linear-gradient(90deg, #ae1c28 0%, #ae1c28 33%, #fff 33%, #fff 66%, #21468b 66%, #21468b 100%)",
    Holland: "linear-gradient(90deg, #ae1c28 0%, #ae1c28 33%, #fff 33%, #fff 66%, #21468b 66%, #21468b 100%)",
    Nederland: "linear-gradient(90deg, #ae1c28 0%, #ae1c28 33%, #fff 33%, #fff 66%, #21468b 66%, #21468b 100%)",
    "New Zealand": "linear-gradient(90deg, #002395 0%, #002395 100%)",
    Nicaragua: "linear-gradient(90deg, #002395 0%, #002395 25%, #fff 25%, #fff 50%, #002395 50%, #002395 100%)",
    Niger: "linear-gradient(90deg, #f77f00 0%, #f77f00 33%, #fff 33%, #fff 66%, #007c5e 66%, #007c5e 100%)",
    Nigeria: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #fff 33%, #fff 66%, #007c5e 66%, #007c5e 100%)",
    "North Macedonia": "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Norway: "linear-gradient(90deg, #002395 0%, #002395 100%)",
    Oman: "linear-gradient(90deg, #fff 0%, #fff 25%, #ce1126 25%, #ce1126 100%)",
    Pakistan: "linear-gradient(90deg, #00401a 0%, #00401a 50%, #fff 50%, #fff 100%)",
    Palau: "linear-gradient(45deg, #002395 0%, #002395 100%)",
    Panama: "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    "Papua New Guinea": "linear-gradient(45deg, #000 0%, #000 25%, #ce1126 25%, #ce1126 50%, #ffc72c 50%, #ffc72c 100%)",
    Paraguay: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #fff 33%, #fff 66%, #002395 66%, #002395 100%)",
    Peru: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Philippines: "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Poland: "linear-gradient(90deg, #fff 0%, #fff 100%)",
    Portugal: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #ce1126 33%, #ce1126 66%, #ffc72c 66%, #ffc72c 100%)",
    Qatar: "linear-gradient(90deg, #8d1b3d 0%, #8d1b3d 100%)",
    Romania: "linear-gradient(90deg, #002395 0%, #002395 33%, #ffc72c 33%, #ffc72c 66%, #ce1126 66%, #ce1126 100%)",
    Russia: "linear-gradient(90deg, #fff 0%, #fff 33%, #002395 33%, #002395 66%, #ce1126 66%, #ce1126 100%)",
    Rwanda: "linear-gradient(45deg, #002395 0%, #002395 33%, #ffc72c 33%, #ffc72c 66%, #007c5e 66%, #007c5e 100%)",
    "Saint Kitts and Nevis": "linear-gradient(45deg, #007c5e 0%, #007c5e 33%, #ffc72c 33%, #ffc72c 66%, #000 66%, #000 100%)",
    "Saint Lucia": "linear-gradient(45deg, #6fa6d6 0%, #6fa6d6 33%, #fff 33%, #fff 66%, #ffc72c 66%, #ffc72c 100%)",
    "Saint Vincent and the Grenadines": "linear-gradient(45deg, #002395 0%, #002395 33%, #ffc72c 33%, #ffc72c 66%, #007c5e 66%, #007c5e 100%)",
    Samoa: "linear-gradient(45deg, #ce1126 0%, #ce1126 100%)",
    "San Marino": "linear-gradient(90deg, #fff 0%, #fff 33%, #6fa6d6 33%, #6fa6d6 66%, #6fa6d6 66%, #6fa6d6 100%)",
    "Sao Tome and Principe": "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #ffc72c 33%, #ffc72c 66%, #000 66%, #000 100%)",
    "Saudi Arabia": "linear-gradient(90deg, #007c5e 0%, #007c5e 100%)",
    Senegal: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #ffc72c 33%, #ffc72c 66%, #ce1126 66%, #ce1126 100%)",
    Serbia: "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Seychelles: "linear-gradient(90deg, #002395 0%, #002395 33%, #ffc72c 33%, #ffc72c 66%, #fff 66%, #fff 100%)",
    "Sierra Leone": "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #fff 33%, #fff 66%, #002395 66%, #002395 100%)",
    Singapore: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Slovakia: "linear-gradient(90deg, #fff 0%, #fff 33%, #ce1126 33%, #ce1126 66%, #002395 66%, #002395 100%)",
    Slovenia: "linear-gradient(90deg, #fff 0%, #fff 33%, #002395 33%, #002395 66%, #ce1126 66%, #ce1126 100%)",
    "Solomon Islands": "linear-gradient(45deg, #002395 0%, #002395 50%, #ffc72c 50%, #ffc72c 100%)",
    Somalia: "linear-gradient(90deg, #002395 0%, #002395 50%, #fff 50%, #fff 100%)",
    "South Africa": "linear-gradient(45deg, #007c5e 0%, #007c5e 20%, #fff 20%, #fff 40%, #000 40%, #000 60%, #ffc72c 60%, #ffc72c 80%, #ce1126 80%, #ce1126 100%)",
    "South Sudan": "linear-gradient(90deg, #000 0%, #000 25%, #fff 25%, #fff 50%, #ce1126 50%, #ce1126 100%)",
    Spain: "linear-gradient(90deg, #ce1126 0%, #ce1126 25%, #ffc72c 25%, #ffc72c 75%, #ce1126 75%, #ce1126 100%)",
    "Sri Lanka": "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Sudan: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #fff 33%, #fff 66%, #000 66%, #000 100%)",
    Suriname: "linear-gradient(90deg, #007c5e 0%, #007c5e 20%, #ffc72c 20%, #ffc72c 80%, #007c5e 80%, #007c5e 100%)",
    Sweden: "linear-gradient(90deg, #002395 0%, #002395 100%)",
    Switzerland: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Syria: "linear-gradient(90deg, #000 0%, #000 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Taiwan: "linear-gradient(90deg, #000080 0%, #000080 100%)",
    Tajikistan: "linear-gradient(90deg, #ce1126 0%, #ce1126 33%, #fff 33%, #fff 66%, #007c5e 66%, #007c5e 100%)",
    Tanzania: "linear-gradient(45deg, #007c5e 0%, #007c5e 33%, #ffc72c 33%, #ffc72c 66%, #000 66%, #000 100%)",
    Thailand: "linear-gradient(90deg, #ce1126 0%, #ce1126 20%, #fff 20%, #fff 40%, #002395 40%, #002395 60%, #fff 60%, #fff 80%, #ce1126 80%, #ce1126 100%)",
    "Timor-Leste": "linear-gradient(45deg, #008000 0%, #008000 50%, #ffc72c 50%, #ffc72c 100%)",
    Togo: "linear-gradient(90deg, #007c5e 0%, #007c5e 33%, #ffc72c 33%, #ffc72c 66%, #ce1126 66%, #ce1126 100%)",
    Tonga: "linear-gradient(90deg, #fff 0%, #fff 50%, #ce1126 50%, #ce1126 100%)",
    "Trinidad and Tobago": "linear-gradient(45deg, #ce1126 0%, #ce1126 50%, #fff 50%, #fff 100%)",
    Tunisia: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Turkey: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Turkmenistan: "linear-gradient(90deg, #007c5e 0%, #007c5e 100%)",
    Tuvalu: "linear-gradient(90deg, #002395 0%, #002395 100%)",
    Uganda: "linear-gradient(90deg, #000 0%, #000 15%, #ffc72c 15%, #ffc72c 45%, #000 45%, #000 100%)",
    Ukraine: "linear-gradient(90deg, #002395 0%, #002395 50%, #ffc72c 50%, #ffc72c 100%)",
    "United Arab Emirates": "linear-gradient(90deg, #007c5e 0%, #007c5e 50%, #fff 50%, #fff 100%)",
    "United Kingdom": "linear-gradient(90deg, #012169 0%, #012169 100%)",
    "United States": "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Uruguay: "linear-gradient(90deg, #fff 0%, #fff 50%, #002395 50%, #002395 100%)",
    Uzbekistan: "linear-gradient(90deg, #002395 0%, #002395 33%, #fff 33%, #fff 66%, #007c5e 66%, #007c5e 100%)",
    Vanuatu: "linear-gradient(45deg, #007c5e 0%, #007c5e 50%, #ffc72c 50%, #ffc72c 100%)",
    "Vatican City": "linear-gradient(90deg, #ffc72c 0%, #ffc72c 100%)",
    Venezuela: "linear-gradient(90deg, #ffc72c 0%, #ffc72c 50%, #002395 50%, #002395 75%, #ce1126 75%, #ce1126 100%)",
    Vietnam: "linear-gradient(90deg, #ce1126 0%, #ce1126 100%)",
    Yemen: "linear-gradient(90deg, #000 0%, #000 33%, #fff 33%, #fff 66%, #ce1126 66%, #ce1126 100%)",
    Zambia: "linear-gradient(90deg, #007c5e 0%, #007c5e 20%, #000 20%, #000 40%, #ce1126 40%, #ce1126 60%, #f3d857 60%, #f3d857 100%)",
    Zimbabwe: "linear-gradient(45deg, #007c5e 0%, #007c5e 20%, #ffc72c 20%, #ffc72c 40%, #ce1126 40%, #ce1126 60%, #000 60%, #000 80%, #fff 80%, #fff 100%)",
  };
  return gradients[country] || "linear-gradient(135deg, #CCCCCC 0%, #CCCCCC 50%, #FFFFFF 50%, #FFFFFF 100%)";
}

// Reverse geocode coordinates to get country and address
async function getLocationFromCoordinates(
  lat: number,
  lng: number
): Promise<{ country?: string; address?: string; city?: string; cap?: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "Accept-Language": "it",
        },
      }
    );

    if (!response.ok) return {};

    const data = await response.json();
    const address = data.address || {};

    const city = address.city || address.town || "Unknown";
    const cap = address.postcode || "—";

    return {
      country: address.country || "Unknown Country",
      address: data.address?.road
        ? `${data.address.road}${
            data.address.house_number ? " " + data.address.house_number : ""
          }, ${city}`
        : city,
      city,
      cap,
    };
  } catch (err) {
    console.error("Geocoding error:", err);
    return { country: "Unknown Country", address: "Unknown Address", city: "Unknown", cap: "—" };
  }
}

export default function StickersPage() {
  const [stickers, setStickers] = useState<StickerWithLocation[]>([]);
  const [groupedStickers, setGroupedStickers] = useState<GroupedStickers>({});
  const [loading, setLoading] = useState(true);
  const [selectedSticker, setSelectedSticker] = useState<StickerWithLocation | null>(null);
  const [expandedCountries, setExpandedCountries] = useState<{ [key: string]: boolean }>({});
  const [sessionVotes, setSessionVotes] = useState<Record<string, VoteChoice>>({});
  const [sessionStatusUpdates, setSessionStatusUpdates] = useState<
    Record<string, SessionStatusUpdate | undefined>
  >({});
  const router = useRouter();

  useEffect(() => {
    loadStickers();
  }, []);

  async function loadStickers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sticker_reports")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (error) {
        console.error("Error loading stickers:", error);
        setLoading(false);
        return;
      }

      // Fetch location data for each sticker
      const stickersWithLocation = await Promise.all(
        (data || []).map(async (sticker: StickerReport) => {
          const location = await getLocationFromCoordinates(
            sticker.lat,
            sticker.lng
          );
          return {
            ...sticker,
            country: location.country || "Unknown Country",
            address: location.address || "Unknown Address",
            city: location.city || "Unknown",
            cap: location.cap || "—",
            status: "pending" as const, // Default status - can be updated from DB if available
            upvotes: sticker.upvotes || 0,
            downvotes: sticker.downvotes || 0,
            last_status: sticker.last_status || null,
            last_status_at: sticker.last_status_at || null,
          };
        })
      );

      // Group by country and sort by date within each country
      const grouped: GroupedStickers = {};

      stickersWithLocation.forEach((sticker) => {
        const country = sticker.country || "Unknown Country";
        if (!grouped[country]) {
          grouped[country] = [];
        }
        grouped[country].push(sticker);
      });

      // Sort each country's stickers chronologically
      Object.keys(grouped).forEach((country) => {
        grouped[country].sort((a, b) => {
          const dateA = a.captured_at ? new Date(a.captured_at).getTime() : 0;
          const dateB = b.captured_at ? new Date(b.captured_at).getTime() : 0;
          return dateB - dateA; // Most recent first
        });
      });

      // Sort countries alphabetically
      const sortedCountries = Object.keys(grouped).sort();
      const finalGrouped: GroupedStickers = {};
      sortedCountries.forEach((country) => {
        finalGrouped[country] = grouped[country];
      });

      setGroupedStickers(finalGrouped);
      setStickers(stickersWithLocation);
    } finally {
      setLoading(false);
    }
  }

  function getUrl(path: string) {
    return supabase.storage.from("stickers").getPublicUrl(path).data.publicUrl;
  }

  async function handleVote(stickerId: string, voteType: "upvote" | "downvote") {
    if (!selectedSticker) return;

    try {
      const currentChoice = sessionVotes[stickerId] ?? null;
      const nextChoice: VoteChoice = currentChoice === voteType ? null : voteType;
      const nowIso = new Date().toISOString();
      const nextStatus: StickerStatus | null =
        nextChoice === "upvote" ? "seen" : nextChoice === "downvote" ? "removed" : null;

      let upvotes = selectedSticker.upvotes;
      let downvotes = selectedSticker.downvotes;

      if (currentChoice === "upvote") upvotes = Math.max(0, upvotes - 1);
      if (currentChoice === "downvote") downvotes = Math.max(0, downvotes - 1);

      if (nextChoice === "upvote") upvotes += 1;
      if (nextChoice === "downvote") downvotes += 1;

      const updatedSticker = {
        ...selectedSticker,
        upvotes,
        downvotes,
        last_status: nextStatus ?? selectedSticker.last_status ?? null,
        last_status_at: nextStatus ? nowIso : selectedSticker.last_status_at ?? null,
      };

      setSessionVotes((prev) => ({
        ...prev,
        [stickerId]: nextChoice,
      }));

      setSessionStatusUpdates((prev) => {
        const updated = { ...prev };
        if (nextStatus) {
          updated[stickerId] = { status: nextStatus, at: nowIso };
        } else {
          delete updated[stickerId];
        }
        return updated;
      });

      setSelectedSticker(updatedSticker);

      // Update in the stickers list
      setStickers((prev) =>
        prev.map((s) => (s.id === stickerId ? updatedSticker : s))
      );

      setGroupedStickers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((country) => {
          updated[country] = updated[country].map((s) =>
            s.id === stickerId ? updatedSticker : s
          );
        });
        return updated;
      });

      if (nextStatus) {
        const { error: updateError } = await supabase
          .from("sticker_reports")
          .update({
            last_status: nextStatus,
            last_status_at: nowIso,
          })
          .eq("id", stickerId);

        if (updateError) {
          console.error("Status update error:", updateError);
        }
      }

      // TODO: Send vote to database
      // const { error } = await supabase
      //   .from("sticker_votes")
      //   .insert({
      //     sticker_id: stickerId,
      //     vote_type: voteType,
      //     created_at: new Date(),
      //   });
      // if (error) console.error("Vote error:", error);
    } catch (err) {
      console.error("Vote error:", err);
    }
  }

  function getLastUpdateInfo(sticker: StickerWithLocation) {
    const sessionUpdate = sessionStatusUpdates[sticker.id];
    if (sessionUpdate) {
      return sessionUpdate;
    }

    if (sticker.last_status && sticker.last_status_at) {
      return { status: sticker.last_status, at: sticker.last_status_at };
    }

    return null;
  }

  function handleViewOnMap(sticker: StickerWithLocation) {
    // Store the location in sessionStorage to be picked up by the map
    sessionStorage.setItem(
      "stickerLocation",
      JSON.stringify({ lat: sticker.lat, lng: sticker.lng })
    );
    // Navigate to home page
    router.push("/");
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "approved":
        return "Approvato";
      case "rejected":
        return "Rifiutato";
      default:
        return "In Sospeso";
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" title="Home page">
              <Logo />
            </Link>
            <div className="hidden sm:block">
              <p className="text-gray-500 text-sm">
                {stickers.length} sticker{stickers.length !== 1 ? "s" : ""} total
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center rounded-full bg-gray-900 text-white w-10 h-10 hover:bg-gray-800 transition active:scale-95"
            title="Back to map"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">
            <p className="text-lg font-medium mb-2">Loading stickers...</p>
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && stickers.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">No stickers yet</p>
            <p className="text-sm mt-1">
              Upload a photo from the map to see it here
            </p>
          </div>
        </div>
      )}

      {/* Stickers List - Grouped by Country */}
      {!loading && stickers.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {Object.entries(groupedStickers).map(([country, countryStickers]) => {
            const isExpanded = expandedCountries[country] === true; // Default to collapsed
            
            return (
              <div key={country} className="mb-6">
                {/* Country Header with Toggle */}
                <button
                  onClick={() =>
                    setExpandedCountries((prev) => ({
                      ...prev,
                      [country]: !prev[country],
                    }))
                  }
                  className="w-full relative flex items-center justify-between p-4 rounded-lg transition mb-3 shadow-lg"
                  style={{ background: getFlagGradient(country) }}
                >
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 relative z-10">
                    {country}
                    <span className="text-xs font-normal text-gray-600 bg-white px-2 py-1 rounded-full">
                      {countryStickers.length}
                    </span>
                  </h2>
                  
                  {/* Glass Effect Overlay */}
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-sm pointer-events-none rounded-lg"></div>
                  
                  {/* Toggle Arrow */}
                  <div
                    className={`transition-transform duration-200 relative z-10 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                </button>

                {/* Stickers List - Collapsible */}
                {isExpanded && (
                  <div className="space-y-2">
                    {countryStickers.map((sticker) => (
                      <button
                        key={sticker.id}
                        onClick={() => setSelectedSticker(sticker)}
                        className="w-full group flex bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition active:scale-95 text-left"
                      >
                        {/* Image - Left Side (50%) */}
                        <div className="w-1/2 aspect-auto overflow-hidden bg-gray-200 relative h-28">
                          <img
                            src={getUrl(sticker.image_path)}
                            alt="Sticker"
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />

                          {/* Status Badge - Overlay */}
                          <div
                            className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(
                              sticker.status
                            )} backdrop-blur-sm bg-opacity-90`}
                          >
                            {getStatusLabel(sticker.status).charAt(0)}
                          </div>
                        </div>

                        {/* Info - Right Side (50%) */}
                        <div className="w-1/2 p-3 flex flex-col justify-center">
                          <p className="text-xs font-semibold text-gray-900 mb-1 line-clamp-1">
                            {sticker.address}
                          </p>
                          
                          <div className="space-y-1">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Città
                              </p>
                              <p className="text-sm font-bold text-gray-900">
                                {sticker.city}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                CAP
                              </p>
                              <p className="text-base font-bold text-gray-900">
                                {sticker.cap}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-gray-500 mt-1">
                            {sticker.captured_at
                              ? new Date(sticker.captured_at).toLocaleDateString(
                                  "it-IT",
                                  {
                                    year: "2-digit",
                                    month: "2-digit",
                                    day: "2-digit",
                                  }
                                )
                              : "—"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSticker && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 animate-in fade-in duration-200"
            onClick={() => setSelectedSticker(null)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <div className="sticky top-0 z-10 flex justify-end p-4 bg-white border-b border-gray-200">
                <button
                  onClick={() => setSelectedSticker(null)}
                  className="text-gray-500 hover:text-gray-700 transition p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Image */}
              <div className="aspect-video overflow-hidden bg-gray-200 w-full">
                <img
                  src={getUrl(selectedSticker.image_path)}
                  alt="Sticker Detail"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {(() => {
                  const updateInfo = getLastUpdateInfo(selectedSticker);
                  if (!updateInfo) return null;

                  return (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Aggiornato al
                      </p>
                      <p className="text-sm text-gray-900">
                        {new Date(updateInfo.at).toLocaleString("it-IT")} -{" "}
                        {updateInfo.status === "seen" ? "Visto" : "Rimosso"}
                      </p>
                    </div>
                  );
                })()}

                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedSticker.address}
                  </h2>
                  <p className="text-gray-600 mb-3">{selectedSticker.country}</p>
                  
                  {/* Uploaded By */}
                  {selectedSticker.uploaded_by && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700 font-semibold">
                        Aggiunto da: <span className="font-bold">{selectedSticker.uploaded_by}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Date/Time */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
                      Data e Ora
                    </p>
                    <p className="text-sm text-gray-900">
                      {selectedSticker.captured_at
                        ? new Date(selectedSticker.captured_at).toLocaleDateString(
                            "it-IT",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "Data sconosciuta"}
                    </p>
                    {selectedSticker.captured_at && (
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(selectedSticker.captured_at).toLocaleTimeString(
                          "it-IT",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }
                        )}
                      </p>
                    )}
                  </div>

                  {/* Coordinates */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
                      Coordinate GPS
                    </p>
                    <p className="text-sm text-gray-900 font-mono">
                      {selectedSticker.lat.toFixed(6)}
                    </p>
                    <p className="text-sm text-gray-900 font-mono">
                      {selectedSticker.lng.toFixed(6)}
                    </p>
                  </div>
                </div>

                {/* Open in Map Button */}
                <button
                  onClick={() => handleViewOnMap(selectedSticker)}
                  className="w-full rounded-lg border border-slate-500/40 bg-slate-900/62 py-3 font-semibold text-slate-100 shadow-[0_10px_24px_rgba(2,6,23,0.28)] backdrop-blur-md transition hover:bg-slate-800/70 active:scale-95"
                >
                  Visualizza sulla Mappa
                </button>

                {/* Sticker Status Voting */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    E ancora li?
                  </p>
                  <p className="text-xs text-gray-600 mb-4">
                    Conferma se lo sticker e ancora visibile nel luogo o se e stato rimosso
                  </p>

                  {/* Vote Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVote(selectedSticker.id, "upvote")}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-3 font-semibold shadow-[0_8px_18px_rgba(15,23,42,0.14)] backdrop-blur-md transition active:scale-95 ${
                        sessionVotes[selectedSticker.id] === "upvote"
                          ? "border-green-200/45 bg-green-600/58 text-white ring-2 ring-green-200/45"
                          : "border-green-300/42 bg-green-500/34 text-green-950 hover:bg-green-500/44"
                      }`}
                    >
                      <span>Si, visto ({selectedSticker.upvotes})</span>
                    </button>

                    <button
                      onClick={() => handleVote(selectedSticker.id, "downvote")}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-3 font-semibold shadow-[0_8px_18px_rgba(15,23,42,0.14)] backdrop-blur-md transition active:scale-95 ${
                        sessionVotes[selectedSticker.id] === "downvote"
                          ? "border-red-200/45 bg-red-600/58 text-white ring-2 ring-red-200/45"
                          : "border-red-300/42 bg-red-500/34 text-red-950 hover:bg-red-500/44"
                      }`}
                    >
                      <span>No, rimosso ({selectedSticker.downvotes})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
