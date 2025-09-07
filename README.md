## Tetris 3D (React + Three.js)

Một trò chơi Tetris 3D chạy trên WebGL, xây dựng bằng React 19, Three.js và Vite. Dự án đi kèm bảng điều chỉnh trực quan (Settings Panel) cho phép tinh chỉnh Camera, OrbitControls, hệ thống ánh sáng (bao gồm mặt trời/mặt trăng chuyển động theo quỹ đạo), và hiệu ứng (Outline/Edges) theo thời gian thực.

### Tính năng chính
- Lưới Tetris 10×20 với khối lập phương 3D, đổ bóng và vật liệu PBR đơn giản.
- Điều khiển bàn phím quen thuộc: di chuyển, xoay, rơi nhanh/mạnh, tạm dừng, khởi động lại.
- Settings Panel chi tiết: Camera, OrbitControls, Lights, Sun/Moon orbit, Effects, Colors.
- Hiệu ứng Outline (postprocessing) và viền Edges có thể bật/tắt.
- Theo dõi và phản hồi thay đổi camera từ người dùng để đồng bộ UI/Settings.
- Overlay “Paused” và “Game Over”.

## Yêu cầu hệ thống
- Node.js >= 18
- Trình duyệt hỗ trợ WebGL2

## Cài đặt và chạy

1) Cài dependencies

```powershell
npm install
```

2) Chạy chế độ phát triển (Vite dev server)

```powershell
npm run dev
```

Vite sẽ in địa chỉ cục bộ (thường là http://localhost:5173). Mở liên kết trong trình duyệt để chơi.

### Build và Preview bản production

```powershell
npm run build
npm run preview
```

Thư mục xuất bản nằm ở `dist/`.

## Điều khiển trò chơi
- Trái/Phải: Di chuyển khối
- Mũi tên Lên: Xoay khối
- Mũi tên Xuống: Rơi nhanh (soft drop)
- Space: Rơi mạnh (hard drop)
- P: Tạm dừng/tiếp tục
- R: Khởi động lại ván chơi

Gợi ý: khi Game Over, bấm R để bắt đầu lại.

## Bảng điều chỉnh (Settings Panel)
Mở/thu gọn ở góc phải. Bạn có thể:

- Camera
	- fov, near, far, distance, height
	- targetX/Y/Z (điểm nhìn)
	- rotX/rotZ (xoay toàn bộ sân chơi)

- Controls (OrbitControls)
	- enableRotate/Zoom/Pan, enableDamping, dampingFactor
	- rotateSpeed, zoomSpeed, panSpeed
	- autoRotate, autoRotateSpeed
	- min/maxDistance, min/maxPolarAngle, min/maxAzimuthAngle

- Lights
	- ambient, directional
	- dirX/Y/Z (hướng nguồn sáng chính)

- Sun/Moon (Celestial)
	- enabled, kind (sun|moon), color, intensity
	- radius, elevationDeg, azimuthDeg
	- autoOrbit, orbitSpeedDeg, castShadow
	- showBody, bodySize (hiển thị thiên thể)

- Effects
	- outlineEnabled, outlineColor, outlineThickness (postprocessing OutlinePass)
	- edgesEnabled, edgesColor (EdgesGeometry overlay)

- Colors
	- borderColor (viền sân)
	- Màu theo từng khối I/J/L/O/S/T/Z

Các chỉnh sửa áp dụng ngay, không cần tải lại trang.

## Cấu trúc thư mục

```
.
├─ index.html
├─ vite.config.js
├─ eslint.config.js
├─ package.json
├─ public/
│  └─ hat.svg
└─ src/
	 ├─ main.jsx
	 ├─ App.jsx
	 ├─ App.css
	 ├─ index.css
	 └─ components/
			├─ Tetris3D.jsx        # Lõi game Three.js + postprocessing + input
+      └─ SettingsPanel.jsx   # UI điều chỉnh thông số theo thời gian thực
```

Các tệp đáng chú ý:
- `src/components/Tetris3D.jsx`: Khởi tạo Scene/Camera/Renderer, OrbitControls, EffectComposer (RenderPass, OutlinePass, FXAA), logic sinh/di chuyển/khóa khối, xoá hàng, xử lý Game Over, cập nhật đèn (kể cả mặt trời/mặt trăng) và render.
- `src/components/SettingsPanel.jsx`: Panel điều chỉnh, đồng bộ hai chiều với state ở `App.jsx`.
- `src/App.jsx`: Quản lý state `settings`, đồng bộ pause/reset với API của game, truyền props xuống `Tetris3D` và `SettingsPanel`.

## Công nghệ sử dụng
- React 19, React DOM
- Three.js (OrbitControls, EffectComposer, RenderPass, OutlinePass, FXAAShader)
- Vite 7 (plugin React SWC)
- ESlint (cấu hình hooks/refresh), lucide-react cho icon UI

## Phát triển
- Chạy lint:

```powershell
npm run lint
```

## Triển khai
Bản build là static, có thể triển khai trên bất kỳ dịch vụ static hosting nào (Vercel, Netlify, GitHub Pages, Nginx…).

Quy trình chung:
1) `npm run build`
2) Deploy thư mục `dist/` theo hướng dẫn của dịch vụ bạn dùng.

## Mẹo và xử lý sự cố
- Màn hình đen hoặc giật: thử tắt Outline hoặc Edges, hoặc giảm `outlineThickness`, kiểm tra GPU/driver trình duyệt.
- Góc nhìn không như ý: kéo-thả chuột để xoay/quay-zoom; panel “Camera” cho phép đặt lại `distance/height/target` hoặc dùng nút reset.
- Không điều khiển được: đảm bảo cửa sổ trình duyệt đang được focus; một số overlay (Paused/Game Over) bỏ qua sự kiện chuột để bạn vẫn dùng phím.

---

Nếu bạn có góp ý hoặc muốn mở tính năng mới, hãy tạo issue hoặc PR. Cảm ơn bạn đã thử Tetris 3D!
