package com.mishiko.infrastructure.adapter.in.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;

@RestController
public class ProductoImagenController {

    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final long MAX_PIXELES = 12_000_000;

    private final Path carpetaSubidas;

    public ProductoImagenController(@Value("${mishiko.upload.dir}") String carpetaSubidas) {
        this.carpetaSubidas = Path.of(carpetaSubidas).toAbsolutePath().normalize();
    }

    @PostMapping("/admin/productos/imagen")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> subirImagen(@RequestParam MultipartFile archivo) throws IOException {
        if (archivo.isEmpty() || archivo.getSize() > MAX_BYTES) {
            throw new BadRequestException("La foto debe tener un tamaño de hasta 5 MB");
        }
        BufferedImage imagen = leerImagen(archivo);
        Files.createDirectories(carpetaSubidas);
        String nombre = UUID.randomUUID() + ".png";
        Path destino = carpetaSubidas.resolve(nombre);
        try {
            if (!ImageIO.write(imagen, "png", destino.toFile())) {
                throw new IOException("No se pudo guardar la foto");
            }
        } catch (IOException e) {
            Files.deleteIfExists(destino);
            throw e;
        }
        return Map.of("imagenUrl", "/uploads/" + nombre);
    }

    private BufferedImage leerImagen(MultipartFile archivo) {
        try (InputStream contenido = archivo.getInputStream();
             ImageInputStream imagen = ImageIO.createImageInputStream(contenido)) {
            Iterator<ImageReader> lectores = ImageIO.getImageReaders(imagen);
            if (!lectores.hasNext()) {
                throw new BadRequestException("Selecciona una imagen PNG o JPEG válida");
            }
            ImageReader lector = lectores.next();
            try {
                String formato = lector.getFormatName();
                if (!"PNG".equalsIgnoreCase(formato) && !"JPEG".equalsIgnoreCase(formato)) {
                    throw new BadRequestException("Selecciona una imagen PNG o JPEG válida");
                }
                lector.setInput(imagen, true, true);
                long pixeles = (long) lector.getWidth(0) * lector.getHeight(0);
                if (pixeles > MAX_PIXELES) {
                    throw new BadRequestException("La foto no puede superar los 12 megapíxeles");
                }
                return lector.read(0);
            } finally {
                lector.dispose();
            }
        } catch (IOException e) {
            throw new BadRequestException("No se pudo leer la foto");
        }
    }
}
