package com.mishiko.infrastructure.adapter.in.web;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.mishiko.domain.model.Mesa;
import com.mishiko.infrastructure.adapter.out.persistence.MesaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@RestController
@RequiredArgsConstructor
public class MesaQrController {

    private final MesaRepository mesaRepository;

    @GetMapping("/mesas/{id}/qr")
    public ResponseEntity<byte[]> generarQr(@PathVariable Long id) throws IOException, WriterException {
        Mesa mesa = mesaRepository.findById(id)
                .filter(m -> Boolean.TRUE.equals(m.getDisponible())
                        && Boolean.TRUE.equals(m.getRestaurante().getActivo()))
                .orElseThrow(() -> new ResourceNotFoundException("Mesa", id));

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/menu.html")
                .queryParam("restauranteId", mesa.getRestaurante().getId())
                .queryParam("mesa", mesa.getNumero())
                .queryParam("mesaId", mesa.getId())
                .build()
                .toUriString();

        BitMatrix matriz = new QRCodeWriter().encode(url, BarcodeFormat.QR_CODE, 240, 240);
        BufferedImage imagen = new BufferedImage(matriz.getWidth(), matriz.getHeight(), BufferedImage.TYPE_BYTE_BINARY);
        for (int y = 0; y < matriz.getHeight(); y++) {
            for (int x = 0; x < matriz.getWidth(); x++) {
                imagen.setRGB(x, y, matriz.get(x, y) ? 0x000000 : 0xFFFFFF);
            }
        }

        ByteArrayOutputStream png = new ByteArrayOutputStream();
        ImageIO.write(imagen, "png", png);
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(png.toByteArray());
    }
}
