package com.mishiko.application.usecase;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.mishiko.domain.model.Comprobante;
import com.mishiko.domain.model.Pedido;
import com.mishiko.infrastructure.adapter.in.web.ResourceNotFoundException;
import com.mishiko.infrastructure.adapter.in.web.dto.ComprobanteResponse;
import com.mishiko.infrastructure.adapter.out.persistence.ComprobanteRepository;
import com.mishiko.infrastructure.adapter.out.persistence.PedidoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComprobantePdfUseCase {

    private final PedidoRepository pedidoRepository;
    private final ComprobanteRepository comprobanteRepository;

    private static final DeviceRgb NARANJA = new DeviceRgb(255, 107, 53);
    private static final DeviceRgb GRIS_OSCURO = new DeviceRgb(45, 55, 72);
    private static final DeviceRgb GRIS_CLARO = new DeviceRgb(248, 248, 248);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Transactional
    public ComprobanteResponse getComprobante(Long pedidoId) {
        Comprobante comp = comprobanteRepository.findByPedidoId(pedidoId)
                .orElseGet(() -> crearComprobante(pedidoId));
        return toComprobanteResponse(comp);
    }

    @Transactional
    public byte[] generarPdf(Long pedidoId) {
        Comprobante comp = comprobanteRepository.findByPedidoId(pedidoId)
                .orElseGet(() -> crearComprobante(pedidoId));

        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", pedidoId));

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document doc = new Document(pdfDoc);
            doc.setMargins(36, 36, 36, 36);

            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            // ── Encabezado ────────────────────────────────────────────────────
            Paragraph titulo = new Paragraph()
                .add(new Text("🍽 MISHIKO\n").setFont(bold).setFontSize(22).setFontColor(NARANJA))
                .add(new Text("Restaurant\n").setFont(regular).setFontSize(12).setFontColor(GRIS_OSCURO))
                .add(new Text("Jr. Las Palmeras 123, Lima, Perú  |  Tel: 01-123-4567\n")
                    .setFont(regular).setFontSize(9))
                .add(new Text("admin@mishiko.com\n").setFont(regular).setFontSize(9))
                .setTextAlignment(TextAlignment.CENTER);
            doc.add(titulo);

            // Línea separadora
            doc.add(new Paragraph("─".repeat(80))
                .setFontColor(NARANJA).setTextAlignment(TextAlignment.CENTER).setFontSize(8));

            // Datos del comprobante
            doc.add(new Paragraph()
                .add(new Text("COMPROBANTE INTERNO\n").setFont(bold).setFontSize(16).setFontColor(GRIS_OSCURO))
                .add(new Text("N° " + comp.getNumeroComprobante()).setFont(bold).setFontSize(13).setFontColor(NARANJA))
                .setTextAlignment(TextAlignment.CENTER));

            doc.add(new Paragraph("\n"));

            // Tabla de datos del pedido
            Table info = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .useAllAvailableWidth();
            addInfoRow(info, "N° Pedido:", pedido.getNumeroPedido(), bold, regular);
            addInfoRow(info, "Mesa:", String.valueOf(pedido.getMesa() != null ? pedido.getMesa().getNumero() : "-"), bold, regular);
            addInfoRow(info, "Cliente:", pedido.getNombreCliente() != null ? pedido.getNombreCliente() : "Sin nombre", bold, regular);
            addInfoRow(info, "Fecha:", pedido.getCreatedAt() != null ? pedido.getCreatedAt().format(FMT) : "-", bold, regular);
            addInfoRow(info, "Estado:", pedido.getEstado().name(), bold, regular);
            if (comp.getMetodoPago() != null) {
                addInfoRow(info, "Método de pago:", comp.getMetodoPago(), bold, regular);
            }
            doc.add(info);
            doc.add(new Paragraph("\n"));

            // Tabla de productos
            Table productos = new Table(UnitValue.createPercentArray(new float[]{40, 15, 20, 25}))
                .useAllAvailableWidth();

            // Encabezados
            String[] headers = {"Descripción", "Cant.", "Precio Unit.", "Subtotal"};
            for (String h : headers) {
                productos.addHeaderCell(new Cell()
                    .add(new Paragraph(h).setFont(bold).setFontSize(10).setFontColor(NARANJA))
                    .setBackgroundColor(GRIS_CLARO));
            }

            // Filas de detalle
            for (var detalle : pedido.getDetalles()) {
                productos.addCell(new Cell().add(new Paragraph(detalle.getProducto().getNombre()).setFont(regular).setFontSize(10)));
                productos.addCell(new Cell().add(new Paragraph(String.valueOf(detalle.getCantidad())).setFont(regular).setFontSize(10).setTextAlignment(TextAlignment.CENTER)));
                productos.addCell(new Cell().add(new Paragraph("S/ " + detalle.getPrecioUnitario().toPlainString()).setFont(regular).setFontSize(10).setTextAlignment(TextAlignment.RIGHT)));
                productos.addCell(new Cell().add(new Paragraph("S/ " + detalle.getSubtotal().toPlainString()).setFont(regular).setFontSize(10).setTextAlignment(TextAlignment.RIGHT)));
                if (detalle.getObservaciones() != null && !detalle.getObservaciones().isBlank()) {
                    Cell obsCell = new Cell(1, 4)
                        .add(new Paragraph("  Obs: " + detalle.getObservaciones())
                            .setFont(regular).setFontSize(9).setItalic());
                    productos.addCell(obsCell);
                }
            }
            doc.add(productos);

            doc.add(new Paragraph("\n"));

            // Totales
            Table totales = new Table(UnitValue.createPercentArray(new float[]{70, 30}))
                .useAllAvailableWidth();
            addTotalRow(totales, "Subtotal:", "S/ " + comp.getSubtotal().toPlainString(), regular, bold, false);
            addTotalRow(totales, "IGV (18%):", "S/ " + comp.getIgv().toPlainString(), regular, bold, false);
            addTotalRow(totales, "TOTAL:", "S/ " + comp.getTotal().toPlainString(), bold, bold, true);
            doc.add(totales);

            doc.add(new Paragraph("\n\n"));

            // Footer
            doc.add(new Paragraph()
                .add(new Text("⚠ Documento interno de referencia – No es comprobante fiscal ni factura electrónica válida ante SUNAT.\n")
                    .setFont(regular).setFontSize(8))
                .add(new Text("Para factura electrónica, solicite al personal del restaurante.\n")
                    .setFont(regular).setFontSize(8))
                .add(new Text("¡Gracias por visitarnos! 🐱 Michi te espera pronto.")
                    .setFont(bold).setFontSize(9).setFontColor(NARANJA))
                .setTextAlignment(TextAlignment.CENTER));

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generando PDF del comprobante para pedido {}: {}", pedidoId, e.getMessage(), e);
            throw new RuntimeException("Error al generar el PDF: " + e.getMessage(), e);
        }
    }

    private Comprobante crearComprobante(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", pedidoId));

        Long maxNum = comprobanteRepository.findMaxNumeroComprobante();
        long siguiente = (maxNum != null ? maxNum : 0L) + 1;
        String numeroComp = String.format("COMP%06d", siguiente);

        Comprobante comp = Comprobante.builder()
                .pedido(pedido)
                .numeroComprobante(numeroComp)
                .subtotal(pedido.getSubtotal())
                .igv(pedido.getIgv())
                .total(pedido.getTotal())
                .estadoPedido(pedido.getEstado().name())
                .build();

        return comprobanteRepository.save(comp);
    }

    private void addInfoRow(Table t, String label, String value, PdfFont bold, PdfFont regular) {
        t.addCell(new Cell().add(new Paragraph(label).setFont(bold).setFontSize(10)));
        t.addCell(new Cell().add(new Paragraph(value).setFont(regular).setFontSize(10)));
    }

    private void addTotalRow(Table t, String label, String value, PdfFont labelFont, PdfFont valueFont, boolean destacado) {
        Cell labelCell = new Cell().add(new Paragraph(label).setFont(labelFont).setFontSize(destacado ? 12 : 10).setTextAlignment(TextAlignment.RIGHT));
        Cell valueCell = new Cell().add(new Paragraph(value).setFont(valueFont).setFontSize(destacado ? 12 : 10).setTextAlignment(TextAlignment.RIGHT));
        if (destacado) {
            labelCell.setFontColor(NARANJA);
            valueCell.setFontColor(NARANJA);
        }
        t.addCell(labelCell);
        t.addCell(valueCell);
    }

    private ComprobanteResponse toComprobanteResponse(Comprobante c) {
        return ComprobanteResponse.builder()
                .id(c.getId())
                .numeroComprobante(c.getNumeroComprobante())
                .pedidoId(c.getPedido().getId())
                .numeroPedido(c.getPedido().getNumeroPedido())
                .subtotal(c.getSubtotal())
                .impuesto(c.getIgv())
                .total(c.getTotal())
                .metodoPago(c.getMetodoPago())
                .estadoPedido(c.getEstadoPedido())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
