package com.mishiko.infrastructure.adapter.in.web;

import com.mishiko.application.usecase.ComprobantePdfUseCase;
import com.mishiko.infrastructure.adapter.in.web.dto.ComprobanteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/comprobantes")
@RequiredArgsConstructor
public class ComprobanteController {

    private final ComprobantePdfUseCase comprobantePdfUseCase;

    @GetMapping("/{pedidoId}")
    public ResponseEntity<ComprobanteResponse> getComprobante(@PathVariable Long pedidoId) {
        return ResponseEntity.ok(comprobantePdfUseCase.getComprobante(pedidoId));
    }

    @GetMapping("/{pedidoId}/pdf")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long pedidoId) {
        byte[] pdfBytes = comprobantePdfUseCase.generarPdf(pedidoId);
        ComprobanteResponse comp = comprobantePdfUseCase.getComprobante(pedidoId);
        String filename = "MISHIKO-" + comp.getNumeroComprobante() + ".pdf";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(pdfBytes.length)
            .body(pdfBytes);
    }
}
