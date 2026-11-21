#!/usr/bin/env python3
"""Genera los .docx ficticios que usa WebMili para probar el lector.

No requiere dependencias externas. Todos los nombres, enlaces y datos son
inventados; los dominios .test están reservados para documentación.
"""

from pathlib import Path
from xml.sax.saxutils import escape
import struct
import zipfile
import zlib

BASE = Path(__file__).resolve().parent

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>
"""

ROOT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"""

STYLES = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="{W}">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia"/>
        <w:sz w:val="24"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="36"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:outlineLvl w:val="1"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:outlineLvl w:val="2"/></w:pPr>
    <w:rPr><w:b/><w:i/><w:sz w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:ind w:left="720"/></w:pPr>
  </w:style>
  <w:style w:type="character" w:styleId="Hyperlink">
    <w:name w:val="Hyperlink"/>
    <w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr>
  </w:style>
</w:styles>
"""

NUMBERING = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="{W}">
  <w:abstractNum w:abstractNumId="0">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/>
      <w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/>
      <w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>
"""


def png(width=320, height=160):
    """PNG RGB sencillo, sin dependencias."""
    raw = bytearray()

    for y in range(height):
        raw.append(0)
        for x in range(width):
            red = 30 + int(150 * x / max(1, width - 1))
            green = 90 + int(90 * y / max(1, height - 1))
            blue = 70 + int(40 * (1 - x / max(1, width - 1)))
            raw.extend((red, green, blue))

    def chunk(kind, data):
        body = kind + data
        return (
            struct.pack(">I", len(data))
            + body
            + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)
        )

    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def run(text, *, bold=False, italic=False, underline=False, strike=False, sup=False, sub=False):
    props = []
    if bold:
        props.append("<w:b/>")
    if italic:
        props.append("<w:i/>")
    if underline:
        props.append('<w:u w:val="single"/>')
    if strike:
        props.append("<w:strike/>")
    if sup:
        props.append('<w:vertAlign w:val="superscript"/>')
    if sub:
        props.append('<w:vertAlign w:val="subscript"/>')
    rpr = f"<w:rPr>{''.join(props)}</w:rPr>" if props else ""
    return f'<w:r>{rpr}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'


def paragraph(text="", *, style=None, runs=None, page_break=False):
    ppr = ""
    if style:
        ppr = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>'
    content = "".join(runs) if runs is not None else (run(text) if text else "")
    page = "<w:r><w:br w:type=\"page\"/></w:r>" if page_break else ""
    return f"<w:p>{ppr}{page}{content}</w:p>"


def list_paragraph(text, *, ordered=False):
    style = "ListParagraph"
    num = f'<w:numPr><w:ilvl w:val="0"/><w:numId w:val="{2 if ordered else 1}"/></w:numPr>'
    return (
        f'<w:p><w:pPr><w:pStyle w:val="{style}"/>{num}</w:pPr>'
        f"{run(text)}</w:p>"
    )


def hyperlink(text, *, rid=None, anchor=None):
    attrs = f' r:id="{rid}"' if rid else f' w:anchor="{anchor}"'
    inner = (
        '<w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr>'
        f'<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'
    )
    return f"<w:hyperlink{attrs}>{inner}</w:hyperlink>"


def table(rows):
    grid = "".join('<w:gridCol w:w="2600"/>' for _ in rows[0])
    body = []

    for index, row in enumerate(rows):
        cells = []
        for value in row:
            shade = '<w:shd w:val="clear" w:color="auto" w:fill="E7EFEA"/>' if index == 0 else ""
            cells.append(
                '<w:tc><w:tcPr>'
                '<w:tcW w:w="2600" w:type="dxa"/>'
                f"{shade}"
                "</w:tcPr>"
                f"<w:p>{run(value, bold=index == 0)}</w:p>"
                "</w:tc>"
            )
        trpr = "<w:trPr><w:tblHeader/></w:trPr>" if index == 0 else ""
        body.append(f"<w:tr>{trpr}{''.join(cells)}</w:tr>")

    return (
        "<w:tbl><w:tblPr>"
        '<w:tblStyle w:val="TableGrid"/>'
        '<w:tblW w:w="0" w:type="auto"/>'
        '<w:tblBorders>'
        '<w:top w:val="single" w:sz="4" w:color="D8C9BD"/>'
        '<w:left w:val="single" w:sz="4" w:color="D8C9BD"/>'
        '<w:bottom w:val="single" w:sz="4" w:color="D8C9BD"/>'
        '<w:right w:val="single" w:sz="4" w:color="D8C9BD"/>'
        '<w:insideH w:val="single" w:sz="4" w:color="D8C9BD"/>'
        '<w:insideV w:val="single" w:sz="4" w:color="D8C9BD"/>'
        "</w:tblBorders>"
        "</w:tblPr>"
        f"<w:tblGrid>{grid}</w:tblGrid>"
        f"{''.join(body)}"
        "</w:tbl>"
    )


def image_paragraph(rid="rId30"):
    cx, cy = 3048000, 1524000
    return (
        "<w:p><w:r><w:drawing>"
        f'<wp:inline distT="0" distB="0" distL="0" distR="0">'
        f'<wp:extent cx="{cx}" cy="{cy}"/>'
        '<wp:effectExtent l="0" t="0" r="0" b="0"/>'
        '<wp:docPr id="1" name="Imagen de ejemplo" descr="Ilustración abstracta de ejemplo"/>'
        '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>'
        '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        "<pic:pic>"
        '<pic:nvPicPr><pic:cNvPr id="1" name="imagen.png" descr="Ilustración abstracta de ejemplo"/><pic:cNvPicPr/></pic:nvPicPr>'
        f'<pic:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
        f'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
        "</pic:pic></a:graphicData></a:graphic></wp:inline>"
        "</w:drawing></w:r></w:p>"
    )


def document(body):
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<w:document xmlns:w="{W}" xmlns:r="{R}" '
        'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        "<w:body>"
        f"{body}"
        '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
        '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" '
        'w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>'
        "</w:body></w:document>"
    )


def relationships(*items):
    joined = "".join(items)
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        f"{joined}</Relationships>"
    )


def hyperlink_rel(rid, target):
    return (
        f'<Relationship Id="{rid}" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" '
        f'Target="{escape(target, {chr(34): "&quot;"})}" TargetMode="External"/>'
    )


def write_docx(name, document_xml, rels_xml, *, image=False):
    path = BASE / name
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", CONTENT_TYPES)
        archive.writestr("_rels/.rels", ROOT_RELS)
        archive.writestr("word/document.xml", document_xml)
        archive.writestr("word/_rels/document.xml.rels", rels_xml)
        archive.writestr("word/styles.xml", STYLES)
        archive.writestr("word/numbering.xml", NUMBERING)
        if image:
            archive.writestr("word/media/imagen.png", png())
    print(path)


def basico():
    body = []
    body.append(paragraph("Guía de lectura de WebMili", style="Heading1"))
    body.append(
        paragraph(
            "Este documento ficticio prueba el lector local: títulos, listas, énfasis, "
            "tablas, una imagen y enlaces internos y externos. No contiene datos personales."
        )
    )
    body.append(paragraph("Una lista de comprobación", style="Heading2"))
    body.append(list_paragraph("El archivo se convierte dentro del navegador."))
    body.append(list_paragraph("El HTML se sanea antes de insertarse."))
    body.append(list_paragraph("Los enlaces externos se abren en otra pestaña."))
    body.append(paragraph("Pasos para probar el lector", style="Heading3"))
    body.append(list_paragraph("Elegir el archivo.", ordered=True))
    body.append(list_paragraph("Esperar el estado de carga.", ordered=True))
    body.append(list_paragraph("Leer y probar los enlaces.", ordered=True))
    body.append(paragraph("Formato en línea", style="Heading2"))
    body.append(
        paragraph(
            style=None,
            runs=[
                run("Texto en "),
                run("negrita", bold=True),
                run(", "),
                run("cursiva", italic=True),
                run(", "),
                run("subrayado", underline=True),
                run(", "),
                run("tachado", strike=True),
                run(", una nota"),
                run("1", sup=True),
                run(" y una variable x"),
                run("2", sub=True),
                run(" para comprobar los estilos."),
            ],
        )
    )
    body.append(paragraph("Tabla de ejemplo", style="Heading2"))
    body.append(
        table(
            [
                ["Elemento", "Qué prueba", "Estado"],
                ["Título", "Jerarquía y tamaño", "Listo"],
                ["Tabla", "Scroll horizontal en móvil", "Listo"],
                ["Imagen", "Ancho máximo y carga diferida", "Listo"],
            ]
        )
    )
    body.append(paragraph("Una imagen", style="Heading2"))
    body.append(paragraph("La imagen siguiente está incrustada en el propio .docx."))
    body.append(image_paragraph())
    body.append(paragraph("Enlaces", style="Heading2"))
    body.append(
        paragraph(
            style=None,
            runs=[
                run("Un "),
                hyperlink("enlace externo seguro", rid="rId10"),
                run(" apunta a un dominio reservado. También hay un "),
                hyperlink("correo de ejemplo", rid="rId11"),
                run(" y un "),
                hyperlink("enlace interno a la sección final", anchor="seccion-final"),
                run("."),
            ],
        )
    )
    body.append(
        paragraph(
            style=None,
            runs=[
                run("El enlace interno debe desplazar la lectura sin recargar la página."),
            ],
        )
    )
    body.append(paragraph("Sección final", style="Heading2"))
    body.append(
        '<w:p><w:bookmarkStart w:id="1" w:name="seccion-final"/>'
        + run("Llegaste a la sección final. El marcador de Word conserva su ancla.")
        + '<w:bookmarkEnd w:id="1"/></w:p>'
    )
    body.append(
        paragraph(
            "Fin del documento de prueba. Todos los datos son inventados y los enlaces usan "
            "el dominio reservado example.test."
        )
    )

    rels = relationships(
        hyperlink_rel("rId10", "https://example.test/recurso"),
        hyperlink_rel("rId11", "mailto:lector@example.test"),
        '<Relationship Id="rId30" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" '
        'Target="media/imagen.png"/>',
    )
    write_docx("lectura-basica.docx", document("".join(body)), rels, image=True)


def enlaces_peligrosos():
    body = []
    body.append(paragraph("Enlaces de prueba de seguridad", style="Heading1"))
    body.append(
        paragraph(
            "Este documento contiene enlaces que el lector debe neutralizar. "
            "Ninguno debe ejecutar código."
        )
    )
    body.append(paragraph("Enlaces permitidos", style="Heading2"))
    body.append(
        paragraph(
            style=None,
            runs=[
                run("Enlace seguro: "),
                hyperlink("example.test", rid="rId20"),
                run(". Correo: "),
                hyperlink("lector@example.test", rid="rId21"),
                run(". Teléfono: "),
                hyperlink("+54 11 5555 0100", rid="rId22"),
                run("."),
            ],
        )
    )
    body.append(paragraph("Enlaces bloqueados", style="Heading2"))
    body.append(
        paragraph(
            style=None,
            runs=[
                run("JavaScript: "),
                hyperlink("no ejecutar", rid="rId23"),
                run(". Datos: "),
                hyperlink("no abrir", rid="rId24"),
                run(". Ancla rota: "),
                hyperlink("destino inexistente", anchor="no-existe"),
                run("."),
            ],
        )
    )
    body.append(
        paragraph(
            "Si una prueba hace clic en los enlaces bloqueados, la app debe mostrar un aviso "
            "y no debe ejecutar código."
        )
    )

    rels = relationships(
        hyperlink_rel("rId20", "https://example.test/seguro"),
        hyperlink_rel("rId21", "mailto:lector@example.test"),
        hyperlink_rel("rId22", "tel:+541155550100"),
        hyperlink_rel("rId23", "javascript:alert('xss')"),
        hyperlink_rel("rId24", "data:text/html,<script>alert('xss')</script>"),
    )
    write_docx("enlaces-peligrosos.docx", document("".join(body)), rels)


def vacio():
    body = "<w:p/><w:p/>"
    rels = relationships()
    write_docx("documento-vacio.docx", document(body), rels)


def medios():
    body = []
    body.append(paragraph("Prueba de reproducción", style="Heading1"))
    body.append(paragraph("Enlaces multimedia", style="Heading2"))
    body.append(
        paragraph(
            style=None,
            runs=[
                run("YouTube: "),
                hyperlink("Demo de YouTube desde el minuto 1:30", rid="rId40"),
                run(". Playlist: "),
                hyperlink("Lista de reproducción", rid="rId41"),
                run("."),
            ],
        )
    )
    body.append(paragraph("Spotify", style="Heading2"))
    body.append(
        paragraph(
            style=None,
            runs=[
                run("Pista: "),
                hyperlink("Pista de prueba", rid="rId42"),
                run(". Álbum duplicado: "),
                hyperlink("Álbum de prueba", rid="rId43"),
                run(". Repetición: "),
                hyperlink("Álbum de prueba repetido", rid="rId44"),
                run("."),
            ],
        )
    )

    rels = relationships(
        hyperlink_rel("rId40", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s"),
        hyperlink_rel("rId41", "https://www.youtube.com/playlist?list=PLabcdef123456"),
        hyperlink_rel("rId42", "https://open.spotify.com/intl-es/track/1234567890abcd"),
        hyperlink_rel("rId43", "https://open.spotify.com/album/1234567890abcd"),
        hyperlink_rel("rId44", "https://open.spotify.com/intl-es/album/1234567890abcd"),
    )
    write_docx("medios.docx", document("".join(body)), rels)


if __name__ == "__main__":
    basico()
    enlaces_peligrosos()
    vacio()
    medios()
