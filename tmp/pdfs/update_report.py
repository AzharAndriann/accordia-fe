from io import BytesIO
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "Laporan_Perancangan_Accrodia_Kelompok_7.pdf"
REPLACEMENT = ROOT / "tmp/pdfs/updated_sections.pdf"
OUTPUT = ROOT / "output/pdf/Laporan_Perancangan_Accordia_Kelompok_7_Diperbarui.pdf"

source_reader = PdfReader(str(SOURCE))
page_box = source_reader.pages[0].mediabox
PAGE_SIZE = (float(page_box.width), float(page_box.height))

MARGIN_X = 24 * mm
MARGIN_TOP = 18 * mm
MARGIN_BOTTOM = 17 * mm
TEXT_WIDTH = PAGE_SIZE[0] - (2 * MARGIN_X)

styles = getSampleStyleSheet()
body = ParagraphStyle(
    "ReportBody",
    parent=styles["BodyText"],
    fontName="Times-Roman",
    fontSize=10.5,
    leading=15,
    textColor=colors.HexColor("#111111"),
    spaceAfter=5,
    alignment=4,
)
body_left = ParagraphStyle("ReportBodyLeft", parent=body, alignment=0)
chapter = ParagraphStyle(
    "Chapter",
    parent=body,
    fontName="Times-Bold",
    fontSize=13,
    leading=18,
    alignment=TA_CENTER,
    spaceAfter=11,
)
section = ParagraphStyle(
    "Section",
    parent=body,
    fontName="Times-Bold",
    fontSize=11,
    leading=16,
    alignment=0,
    spaceBefore=4,
    spaceAfter=5,
)
table_header = ParagraphStyle(
    "TableHeader",
    parent=body_left,
    fontName="Times-Bold",
    fontSize=7.4,
    leading=9.2,
    textColor=colors.white,
)
table_cell = ParagraphStyle(
    "TableCell",
    parent=body_left,
    fontSize=7.2,
    leading=9.2,
)
table_status = ParagraphStyle(
    "TableStatus",
    parent=table_cell,
    fontName="Times-Bold",
    textColor=colors.HexColor("#176B5B"),
)
note = ParagraphStyle(
    "Note",
    parent=body_left,
    fontSize=9.2,
    leading=13,
    textColor=colors.HexColor("#344A45"),
)


def p(text, style=body):
    return Paragraph(text, style)


def numbered(items):
    blocks = []
    for number, text in enumerate(items, start=1):
        blocks.append(
            Table(
                [[p(f"{number}.", body_left), p(text, body)]],
                colWidths=[7 * mm, TEXT_WIDTH - (7 * mm)],
                style=TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                        ("TOPPADDING", (0, 0), (-1, -1), 0),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
                    ]
                ),
            )
        )
    return blocks


def result_table(rows, repeat_header=True):
    header = [
        p("Skenario", table_header),
        p("Langkah pengujian", table_header),
        p("Hasil aktual", table_header),
        p("Status", table_header),
    ]
    data = [header]
    for scenario, steps, actual, status in rows:
        data.append(
            [
                p(scenario, table_cell),
                p(steps, table_cell),
                p(actual, table_cell),
                p(status, table_status),
            ]
        )
    table = Table(
        data,
        colWidths=[27 * mm, 49 * mm, 74 * mm, 21 * mm],
        repeatRows=1 if repeat_header else 0,
        hAlign="LEFT",
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#176B5B")),
                ("GRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#BFCBC8")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4.5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4.5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F7F6")]),
            ]
        )
    )
    return table


def page_number(canvas, doc):
    canvas.saveState()
    logical_page = 13 + doc.page
    canvas.setFont("Times-Roman", 9)
    canvas.setFillColor(colors.HexColor("#333333"))
    canvas.drawCentredString(PAGE_SIZE[0] / 2, 9 * mm, str(logical_page))
    canvas.restoreState()


doc = BaseDocTemplate(
    str(REPLACEMENT),
    pagesize=PAGE_SIZE,
    leftMargin=MARGIN_X,
    rightMargin=MARGIN_X,
    topMargin=MARGIN_TOP,
    bottomMargin=MARGIN_BOTTOM,
)
frame = Frame(
    MARGIN_X,
    MARGIN_BOTTOM,
    TEXT_WIDTH,
    PAGE_SIZE[1] - MARGIN_TOP - MARGIN_BOTTOM,
    id="main",
    leftPadding=0,
    rightPadding=0,
    topPadding=0,
    bottomPadding=0,
)
doc.addPageTemplates(PageTemplate(id="report", frames=[frame], onPage=page_number))

summary_items = [
    "Accordia telah diimplementasikan sebagai aplikasi kolaborasi freelancer dan klien yang mencakup proyek, undangan, versi kesepakatan, perubahan pekerjaan, penyerahan, catatan pembayaran, aktivitas, sengketa, dan pembatalan.",
    "Alur akun dan sesi telah berjalan, termasuk registrasi, login, persetujuan kebijakan, penyimpanan sesi, refresh token, logout, serta pembersihan data lokal dan token notifikasi.",
    "Undangan dapat diterima melalui daftar undangan, notifikasi, tautan aplikasi, atau input kode undangan. Akses proyek berubah sesuai status undangan dan keanggotaan.",
    "Kesepakatan, perubahan, pembayaran, penyerahan hasil, dan keputusan sengketa tercatat pada server serta ditampilkan kembali melalui riwayat aktivitas proyek.",
    "Push notification telah berhasil diterima pada perangkat Android fisik. Pesan notifikasi disesuaikan dengan konteks kejadian dan dapat mengarahkan pengguna ke layar yang relevan.",
    "Tampilan aplikasi telah disempurnakan menggunakan komponen dan tema yang konsisten, termasuk kalender tanggal lahir, modal konfirmasi khusus, card proyek, navigasi pengaturan, serta timeline aktivitas.",
]

rows_page_15 = [
    (
        "Akun dan sesi",
        "Registrasi dan login dua peran; pilih tanggal lahir; setujui kebijakan; logout dan ganti akun.",
        "Peran dan sesi sesuai akun. Persetujuan beserta versi kebijakan tersimpan. Logout membersihkan sesi lokal dan menonaktifkan token push perangkat.",
        "Berhasil",
    ),
    (
        "Proyek dan undangan",
        "Freelancer membuat proyek dan mengundang klien. Klien menerima melalui notifikasi, daftar undangan, tautan aplikasi, atau input kode.",
        "Proyek dibuat, undangan tercatat, dan klien dapat bergabung. Akses proyek konsisten dengan keanggotaan. Antrean email dapat diproses sesuai konfigurasi layanan.",
        "Berhasil",
    ),
    (
        "Kesepakatan",
        "Isi ruang lingkup, hasil, biaya, tenggat, revisi, pembatalan, dan hak karya; ajukan versi; uji setuju dan tolak.",
        "Versi tersimpan konsisten. Persetujuan membawa contentHash dan penolakan merekam alasan serta status yang tepat.",
        "Berhasil",
    ),
    (
        "Perubahan",
        "Klien meminta perubahan pada proyek aktif; freelancer mengusulkan versi; kedua pihak memberi keputusan.",
        "Perbandingan nominal dan tenggat tampil. Versi baru, keputusan, dan status mengikuti respons server.",
        "Berhasil",
    ),
    (
        "Penyerahan",
        "Freelancer mengunggah file atau tautan; klien meminta revisi lalu menerima hasil berikutnya.",
        "Progres unggah tampil dan riwayat penyerahan, revisi, serta penerimaan tercatat pada proyek dan aktivitas.",
        "Berhasil",
    ),
    (
        "Pembayaran",
        "Klien mengunggah nominal dan bukti; freelancer mengonfirmasi atau menolak catatan.",
        "Ringkasan nominal terkonfirmasi, sisa, dan kelebihan sesuai data. Aplikasi tetap menyatakan proses sebagai pencatatan, bukan verifikasi bank.",
        "Berhasil",
    ),
]

rows_page_16 = [
    (
        "Aktivitas dan keanggotaan",
        "Buka aktivitas langsung dari detail proyek; periksa pagination; batalkan undangan; ajukan dan tanggapi pelepasan klien.",
        "Timeline menampilkan kejadian berurutan dan dapat diakses tanpa notifikasi. Status undangan dan keanggotaan sesuai keputusan server.",
        "Berhasil",
    ),
    (
        "Validasi dan gangguan",
        "Uji input tidak valid, batas jumlah dan ukuran file, tipe file tidak didukung, serta API tidak tersedia.",
        "Input ditolak dengan pesan yang jelas. Kesalahan jaringan tidak ditampilkan sebagai keberhasilan dan pengguna dapat mencoba kembali.",
        "Berhasil",
    ),
    (
        "Otorisasi",
        "Akun lain mencoba membuka proyek dan file yang bukan miliknya melalui endpoint API.",
        "Backend menolak akses tanpa izin. Pembatasan tidak hanya bergantung pada tombol yang disembunyikan di frontend.",
        "Berhasil",
    ),
    (
        "Push notification",
        "Daftarkan perangkat Android, kirim notifikasi uji dan event undangan, lalu periksa navigasi serta kondisi setelah logout.",
        "Notifikasi uji dan kontekstual diterima pada Android fisik. Token terdaftar saat login dan dinonaktifkan setelah logout.",
        "Berhasil (Android)",
    ),
    (
        "Sengketa dan pembatalan",
        "Catat sengketa, ajukan solusi, uji persetujuan atau penolakan pihak lain, kemudian uji pembatalan proyek.",
        "Modal konfirmasi, hak akses, riwayat keputusan, notifikasi, dan status proyek berjalan sesuai aturan backend.",
        "Berhasil",
    ),
]

story = [
    p("3.5 Ringkasan Hasil Perancangan dan Implementasi", section),
    *numbered(summary_items),
    Spacer(1, 4),
    p("3.6 Hasil Pengujian dan Keterbatasan", section),
    p(
        "Pengujian dilaksanakan menggunakan akun freelancer, akun klien, dan akun lain untuk memeriksa alur utama, validasi, gangguan jaringan, serta pembatasan akses. Tabel 3.1 mencatat hasil aktual setelah penyempurnaan frontend, backend, konfigurasi notifikasi, deep link, dan koneksi perangkat fisik.",
    ),
    p(
        "Seluruh skenario fungsional yang berada dalam ruang lingkup laporan berhasil dijalankan. Pengujian push remote dilakukan pada perangkat Android fisik karena simulator iOS tidak mendukung penerimaan push notification remote seperti perangkat nyata.",
    ),
    PageBreak(),
    p("Tabel 3.1 Hasil Pengujian Fungsional", ParagraphStyle("Caption", parent=body_left, fontName="Times-Bold", fontSize=9.5, leading=12, spaceAfter=6)),
    result_table(rows_page_15),
    PageBreak(),
    p("Tabel 3.1 Hasil Pengujian Fungsional (lanjutan)", ParagraphStyle("Caption2", parent=body_left, fontName="Times-Bold", fontSize=9.5, leading=12, spaceAfter=6)),
    result_table(rows_page_16),
    Spacer(1, 10),
    KeepTogether(
        [
            p("Keterbatasan Pengujian", section),
            p(
                "Pengujian membuktikan fungsi aplikasi pada lingkungan pengembangan dan perangkat Android fisik yang digunakan. Push notification remote pada iOS belum diuji pada perangkat iPhone fisik karena pengujian hanya tersedia melalui simulator. Keberhasilan pengiriman email eksternal tetap bergantung pada kredensial dan konfigurasi penyedia email. Pengujian keamanan formal, beban berskala besar, audit kepatuhan hukum, dan evaluasi pengguna nyata berada di luar ruang lingkup laporan ini.",
            ),
            p(
                "Hasil tersebut menunjukkan bahwa alur utama Accordia telah dapat digunakan untuk demonstrasi dan pengujian tugas. Hasil ini tidak menggantikan audit keamanan, verifikasi identitas resmi, verifikasi transaksi bank, atau penilaian hukum oleh pihak yang berkompeten.",
                note,
            ),
        ]
    ),
    PageBreak(),
    p("BAB IV SIMPULAN DAN SARAN", chapter),
    p("4.1 Simpulan", section),
    p(
        "Accordia telah berhasil diimplementasikan sebagai aplikasi mobile untuk mendokumentasikan kesepakatan dan kolaborasi antara freelancer dan klien. Fungsi yang tersedia mencakup akun dan sesi, proyek, undangan, versi kesepakatan, perubahan pekerjaan, penyerahan hasil, pencatatan pembayaran, aktivitas, notifikasi, sengketa, serta pembatalan proyek.",
    ),
    p(
        "Berdasarkan pengujian fungsional, alur utama aplikasi berjalan sesuai hasil yang diharapkan. Data proyek dan keputusan tersimpan melalui backend, hak akses diterapkan berdasarkan peran dan keanggotaan, aktivitas dapat ditelusuri secara berurutan, serta push notification kontekstual berhasil diterima pada perangkat Android fisik. Perbaikan antarmuka juga membuat proses persetujuan, navigasi, dan pembacaan riwayat lebih jelas.",
    ),
    p(
        "Dengan demikian, Accordia telah memenuhi ruang lingkup implementasi dan demonstrasi yang ditetapkan dalam laporan. Meskipun demikian, penerapan pada lingkungan produksi masih memerlukan pengujian perangkat iOS fisik, audit keamanan, evaluasi pengguna, peninjauan kebijakan, serta pemenuhan kewajiban hukum dan operasional yang relevan.",
    ),
    p("4.2 Saran", section),
    *numbered(
        [
            "Melakukan pengujian push notification pada perangkat iPhone fisik serta memverifikasi pengiriman email menggunakan konfigurasi layanan produksi.",
            "Menambahkan pengujian otomatis end-to-end, pengujian beban, pemantauan error, dan audit keamanan sebelum aplikasi digunakan oleh pengguna luas.",
            "Mengevaluasi kemudahan penggunaan bersama calon freelancer dan klien, khususnya pada layar kesepakatan, perubahan, pembayaran, penyerahan, aktivitas, dan sengketa.",
            "Menelaah Syarat dan Ketentuan, Kebijakan Privasi, retensi data, pengamanan rekaman, serta kewajiban penyelenggara bersama pihak yang berkompeten.",
        ]
    ),
]

doc.build(story)

replacement_reader = PdfReader(str(REPLACEMENT))
if len(replacement_reader.pages) != 4:
    raise RuntimeError(f"Expected 4 replacement pages, got {len(replacement_reader.pages)}")

writer = PdfWriter()


def update_index_label(page, index):
    if index not in (2, 4):
        return page
    packet = BytesIO()
    overlay = canvas.Canvas(packet, pagesize=PAGE_SIZE)
    overlay.setFillColor(colors.white)
    if index == 2:
        overlay.rect(121, 389, 395, 17, fill=1, stroke=0)
        overlay.setFillColor(colors.black)
        overlay.setFont("Times-Roman", 11)
        overlay.drawString(127.5, 393.8, "3.6 Hasil Pengujian dan Keterbatasan")
        overlay.drawRightString(511.2, 393.8, "14")
        overlay.setLineWidth(0.7)
        overlay.setDash(1, 1.7)
        overlay.line(304, 395.2, 496, 395.2)
    else:
        overlay.rect(108, 679, 408, 18, fill=1, stroke=0)
        overlay.setFillColor(colors.black)
        overlay.setFont("Times-Roman", 11)
        overlay.drawString(113.6, 683.8, "Tabel 3.1 Hasil Pengujian Fungsional")
        overlay.drawRightString(511.2, 683.8, "15")
        overlay.setLineWidth(0.7)
        overlay.setDash(1, 1.7)
        overlay.line(301, 685.2, 496, 685.2)
    overlay.save()
    packet.seek(0)
    page.merge_page(PdfReader(packet).pages[0])
    return page


for index, page in enumerate(source_reader.pages):
    if index == 18:
        for replacement_page in replacement_reader.pages:
            writer.add_page(replacement_page)
    if 18 <= index <= 21:
        continue
    writer.add_page(update_index_label(page, index))

if source_reader.metadata:
    metadata = {key: str(value) for key, value in source_reader.metadata.items() if value is not None}
    metadata["/Title"] = "Laporan Perancangan Aplikasi Accordia - Diperbarui"
    metadata["/Subject"] = "Hasil implementasi dan pengujian fungsional Accordia"
    writer.add_metadata(metadata)

with OUTPUT.open("wb") as stream:
    writer.write(stream)

final_reader = PdfReader(str(OUTPUT))
if len(final_reader.pages) != len(source_reader.pages):
    raise RuntimeError("Final page count changed unexpectedly")
print(OUTPUT)
