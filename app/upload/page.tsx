import { UploadStudio } from '@/components/UploadStudio';

export default function UploadPage() {
  return (
    <div className="stack-xl">
      <div className="page-header">
        <div>
          <div className="eyebrow">Upload + OCR + PDF + Review</div>
          <h1>Kelime seti ekle</h1>
          <p>Görsel yükle, metin yapıştır veya PDF seç. Sistem kelimeleri temizleyip doğrular, sen de kaydetmeden önce düzenlersin.</p>
        </div>
      </div>
      <UploadStudio />
    </div>
  );
}
