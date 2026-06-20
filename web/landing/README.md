# CIFEDRA CONNECT Landing

Статический лендинг продукта со ссылкой на клиентский WEB и QR-кодами
мобильных приложений.

## Файлы

| Файл | Назначение |
| --- | --- |
| `index.html` | Разметка лендинга. |
| `styles.css` | Стили лендинга на базе бренд-токенов CIFEDRA. |
| `assets/qr-ios.svg` | QR-код для iOS-ссылки. |
| `assets/qr-android.svg` | QR-код для Android-ссылки. |

## Текущие ссылки приложений

Пока реальные ссылки App Store и Google Play не опубликованы, QR-коды ведут на redirect-URL:

| Платформа | URL |
| --- | --- |
| WEB | `https://app.cifedra.app` |
| iOS | `https://cifedra.app/ios` |
| Android | `https://cifedra.app/android` |

Когда появятся реальные ссылки, лучше настроить эти redirect-URL на домене продукта. Если redirect-домен изменится, нужно обновить ссылки в `index.html` и перегенерировать QR SVG в `assets/`.

## Локальный просмотр

Запускать сервер нужно из корня репозитория, потому что лендинг использует общие бренд-ассеты из `brand/cifedra/`:

```bash
python3 -m http.server 4177
```

После запуска открыть:

```text
http://localhost:4177/web/landing/
```
