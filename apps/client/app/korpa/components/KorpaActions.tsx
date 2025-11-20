'use client';

import { useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaTrashAlt, FaShoppingCart } from 'react-icons/fa';
import { ocistiKorpu } from '@actions/korpa';
import { kreirajPorudzbinu } from '@actions/porudzbine';
import { getPodaciPreuzimanja } from '@actions/podaci-preuzimanja';
import { useKorpa } from '../../components/KorpaContext';


interface StavkaKorpe {
  id: string;
  kolicina: number;
  proizvod?: {
    id: string;
    naziv_sr: string;
    naziv_en: string;
    cena: number;
    slika?: string | null;
  } | null;
}

interface KorpaActionsProps {
  userId: string;
  stavke: StavkaKorpe[];
  onUpdate: () => void;
}

export default function KorpaActions({ userId, stavke, onUpdate }: KorpaActionsProps) {
  const { t } = useTranslation('korpa');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { resetKorpa } = useKorpa();
  const { data: session } = useSession();

  const ukupno = stavke.reduce((acc, s) => acc + (s.proizvod ? s.proizvod.cena * s.kolicina : 0), 0);

  const isprazniKorpu = async () => {
    startTransition(async () => {
      try {
        const result = await ocistiKorpu(userId);

        if (!result.success) {
          toast.error(result.error || 'Greška pri brisanju korpe');
          return;
        }

        resetKorpa();
        localStorage.setItem('brojUKorpi', '0');
        window.dispatchEvent(new Event('korpaChanged'));
        onUpdate();
        toast.success('Korpa je ispražnjena');
      } catch (error) {
        console.error('Greška pri brisanju korpe:', error);
        toast.error(t('error') || 'Greška pri brisanju korpe');
      }
    });
  };

  const potvrdiPorudzbinu = async (): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      startTransition(async () => {
        try {
          const porudzbinaData = {
            korisnikId: userId,
            ukupno,
            status: 'Na čekanju',
            stavke: stavke.map(s => ({
              proizvodId: s.proizvod?.id || '',
              kolicina: s.kolicina,
              cena: s.proizvod?.cena || 0,
              slika: s.proizvod?.slika || undefined
            })),
          };

          const result = await kreirajPorudzbinu(porudzbinaData);

          if (!result.success) {
            toast.error(result.error || t('error') || 'Greška pri kreiranju porudžbine');
            resolve(false);
            return;
          }

          await isprazniKorpu();
          resolve(true);
        } catch (error) {
          console.error('Error creating order:', error);
          toast.error(t('error') || 'Greška pri kreiranju porudžbine');
          resolve(false);
        }
      });
    });
  };

  const handleZavrsiKupovinu = async () => {
    console.log('[DEBUG] handleZavrsiKupovinu called');
    startTransition(async () => {
      try {
        // Check delivery data
        const podaciResult = await getPodaciPreuzimanja(userId);
        console.log('[DEBUG] podaciResult:', podaciResult);

        if (!podaciResult.success || !podaciResult.data) {
          toast.error(t('no_data_redirect') || "Nemate unete podatke za preuzimanje. Bićete preusmereni na stranicu za unos podataka.", { duration: 5000 });
          setTimeout(() => {
            router.push('/podaci-preuzimanja');
          }, 2000);
          return;
        }

        // Create order
        const success = await potvrdiPorudzbinu();
        console.log('[DEBUG] potvrdiPorudzbinu success:', success);
        if (success) {
          // Pošalji email potvrdu korisniku koristeći podatke iz session.user
          try {
            const user = session?.user;
            console.log('[DEBUG] session.user:', user);
            if (user?.email) {
              const ime = (user as any).ime || (user as any).name?.split(' ')[0] || '';
              const prezime = (user as any).prezime || (user as any).name?.split(' ')[1] || '';
              console.log('[EMAIL DEBUG] Šaljem email potvrdu:', { email: user.email, ime, prezime });
              const emailRes = await fetch('/api/proizvodi/email/posalji', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: user.email,
                  subject: '✅ Vaša porudžbina je uspešno kreirana!',
                  html: `
                    <h2>✅ Vaša porudžbina je uspešno kreirana!</h2>
                    <p><b>Ime:</b> ${ime}</p>
                    <p><b>Prezime:</b> ${prezime}</p>
                    <p><b>Email:</b> ${user.email}</p>
                  `
                })
              });
              console.log('[EMAIL DEBUG] Odgovor sa servera:', emailRes.status, await emailRes.text());
            }
          } catch (err) {
            console.error('[EMAIL DEBUG] Greška pri slanju email potvrde:', err);
            toast.error('Greška pri slanju email potvrde.');
          }
          toast.success('Potvrda porudžbine je poslata na email!', { duration: 4000 });
          router.push('/');
        }
      } catch (error) {
        console.error('Error completing purchase:', error);
        toast.error(t('error') || 'Greška pri završavanju kupovine');
      }
    });
  };

  console.log('[DEBUG] KorpaActions render, stavke:', stavke);
  if (!stavke.length) {
    console.log('[DEBUG] KorpaActions: nema stavki u korpi, dugme se ne prikazuje');
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Ukupno */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>{t('ukupno') || 'Ukupno'}:</span>
          <span>{ukupno.toFixed(2)} €</span>
        </div>
      </div>

      {/* Akcije */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={isprazniKorpu}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <FaTrashAlt />
          )}
          {t('isprazni_korpu') || 'Isprazni korpu'}
        </button>

        <button
          onClick={() => {
            console.log('[DEBUG] Dugme Završi kupovinu kliknuto');
            handleZavrsiKupovinu();
          }}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <FaShoppingCart />
          )}
          {t('zavrsi_kupovinu') || 'Završi kupovinu'}
        </button>
      </div>
    </div>
  );
}