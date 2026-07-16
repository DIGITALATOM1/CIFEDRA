# CIFEDRA CONNECT Landing

Статический лендинг продукта со ссылкой на клиентский WEB, локальный
`Alliance Board` prototype и QR-кодами мобильных приложений.

## Файлы

| Файл | Назначение |
| --- | --- |
| `index.html` | Разметка лендинга. |
| `styles.css` | Стили лендинга на базе бренд-токенов CIFEDRA. |
| `assets/qr-ios.svg` | QR-код для iOS-ссылки. |
| `assets/qr-android.svg` | QR-код для Android-ссылки. |

Связанная пользовательская страница:

| Страница | URL |
| --- | --- |
| Alliance Board prototype | `../app/` |
| Matching Kanban prototype | `../app/matching.html` |

## Текущие ссылки приложений

Пока реальные ссылки App Store и Google Play не опубликованы, QR-коды ведут на redirect-URL:

| Платформа | URL |
| --- | --- |
| WEB production placeholder | `https://app.cifedra.app` |
| WEB local prototype | `http://localhost:4177/web/app/` |
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

Пользовательская рабочая страница:

```text
http://localhost:4177/web/app/
http://localhost:4177/web/app/matching.html
```
