"use strict";

window.onload = ()=>{ setup(); };

const App = {
	canvas: null,
	ctx: null,
	image_data: null,
	buffer8: null,
	buffer32: null,
	data: null,
	logo_x: 0,
	logo_y: 0,
	logo_width: 0,
	logo_height: 0,
	logo_buffer32: null,
	fire_is_starting: true,
	fire_is_stopping: false,
	fire_is_paused: false,
	fire_palette_ratio: 2,
	timer: 0,
	frame_count: 0,
	frame_per_seconds: 0
};

const palette = [
	0x00000000,	0xFF070707,	0xFF07071F,	0xFF070F2F,
	0xFF070F47,	0xFF071757,	0xFF071F67,	0xFF071F77,
	0xFF07278F,	0xFF072F9F,	0xFF073FAF,	0xFF0747BF,
	0xFF0747C7,	0xFF074FDF,	0xFF0757DF,	0xFF0757DF,
	0xFF075FD7,	0xFF075FD7,	0xFF0F67D7,	0xFF0F6FCF,
	0xFF0F77CF,	0xFF0F7FCF,	0xFF1787CF,	0xFF1787C7,
	0xFF178FC7,	0xFF1F97C7,	0xFF1F9FBF,	0xFF1F9FBF,
	0xFF27A7BF,	0xFF27A7BF,	0xFF2FAFBF,	0xFF2FAFB7,
	0xFF2FB7B7,	0xFF37B7B7,	0xFF6FCFCF,	0xFF9FDFDF,
	0xFFC7EFEF,	0xFFFFFFFF
];

function setup() {

	App.canvas = document.getElementById("Canvas");
	App.ctx = App.canvas.getContext("2d", {alpha: false});
	App.ctx.fillStyle = "rgb(192, 192, 192)";
	App.ctx.font = "12px Lucida Console";
	App.image_data = App.ctx.createImageData(App.canvas.width, App.canvas.height);
	
	const img = new Image();
	img.src= "doom.png";
	img.onload = ()=>{

		App.logo_width = img.width;
		App.logo_height = img.height;
		App.logo_x = Math.floor( (App.canvas.width - App.logo_width) / 2 );
		App.logo_y = Math.floor( (App.canvas.height - App.logo_height) / 2 );
		App.ctx.drawImage(img, 0, 0);
		let image_data = App.ctx.getImageData(0, 0, img.width, img.height);
		App.ctx.clearRect(0, 0, img.width, img.height);
		App.logo_buffer32 = new Uint32Array(img.width * img.height);

		let index = 0;
		let count = image_data.data.length;
		while(index < count) {

			const r = image_data.data[index];
			const g = image_data.data[index + 1];
			const b = image_data.data[index + 2];
			let a = image_data.data[index + 3];
			if(r === 0 && g === 0 && b === 0) a = 0;

			const rgba = r | (g << 8) | (b << 16) | (a << 24);
			const buffer_index = Math.round(index / 4);
			App.logo_buffer32[buffer_index] = rgba;
			index += 4;
		}

		App.timer = performance.now;
		requestAnimationFrame(loop);
	}

	const buffer = new ArrayBuffer(App.image_data.data.length);
	App.buffer8 = new Uint8ClampedArray(buffer);
	App.buffer32 = new Uint32Array(buffer);

	App.data = new Uint8ClampedArray(App.canvas.width * App.canvas.height);

	document.getElementById("Fire_Button").onclick = toggle_animation;
}

function fire_button_on_click() {

	if(App.fire_is_stopping === false) {
		stop_fire();
		document.getElementById("Fire_Button").innerHTML = "Start";
	}
	else {
		start_fire();
		document.getElementById("Fire_Button").innerHTML = "Stop";
	}
}

function start_fire() {
	App.fire_is_starting = true;
	App.fire_is_stopping = false;
}

function stop_fire() {
	App.fire_is_starting = false;
	App.fire_is_stopping = true;
}

function toggle_animation() {
	if(App.fire_is_paused === true) {
		App.fire_is_paused = false;
		requestAnimationFrame(loop);
	}
	else {
		App.fire_is_paused = true;
	}
}

function loop(timestamp) {

	if(App.fire_is_paused === true) return;

	// draw logo
	if(App.logo_buffer32 !== null) {
		const offset = App.logo_y * App.canvas.width + App.logo_x;
		let src_index = 0;
		const src_count = App.logo_buffer32.length;
		while(src_index < src_count) {
			const y = Math.floor(src_index / App.logo_width);
			const x = src_index % App.logo_width;
			const dst_index = offset + y * App.canvas.width + x;
			if( (App.logo_buffer32[src_index] >> 24) !== 0)
				App.buffer32[dst_index] = App.logo_buffer32[src_index];
			src_index++;
		}
	}

	// fuel fire
	let starting_count = 0;
	if(App.fire_is_starting === true) {
		let index = (App.canvas.height - 7) * App.canvas.width;
		const count = App.canvas.width * App.canvas.height;
		while(index < count) {
			if( App.data[index] < (palette.length * App.fire_palette_ratio - 1) ) {
				App.data[index] += Math.round(Math.random());
			}
			else {
				starting_count++;
			}
			index++;
		}
		if(starting_count > 50 * 7 * App.canvas.width) {
			App.fire_is_starting = false;
		}
	}

	// stop fire
	if(App.fire_is_stopping === true) {
		let index = (App.canvas.height - 7) * App.canvas.width;
		const count = App.canvas.width * App.canvas.height;
		while(index < count) {
			if(App.data[index] > 0) {
				App.data[index] -= Math.round(Math.random()) & 3;
			}
			index++;
		}
	}

	// update fire
	let pixels_updated = 0;

	// if starting or stopping update bottom row
	if(App.fire_is_starting === true || App.fire_is_stopping === true) {
		let index = App.canvas.width * (App.canvas.height - 2);
		const count = App.canvas.width * App.canvas.height;
		while(index < count) {
			const palette_index = Math.floor(App.data[index] / App.fire_palette_ratio);
			App.buffer32[index] = palette[palette_index];
			pixels_updated++;
			index++;
		}		 
	}

    for (let y = 1; y < App.canvas.height; y++) {
        for (let x = 0; x < App.canvas.width; x++) {

			const src_index = y * App.canvas.width + x;
			if(App.data[src_index] < App.fire_palette_ratio - 1) continue;

			const direction = Math.round(Math.random() * 2) - 1;
			const dst_index = src_index - App.canvas.width + direction;

			const decay = (Math.random() * 3) & 1;
			const dst_value = App.data[src_index] - decay;
			const palette_index = Math.floor(dst_value / App.fire_palette_ratio);

			App.data[dst_index] = dst_value;

			let color = palette[palette_index];
			const dst_x = dst_index % App.canvas.width;
			const dst_y = Math.floor(dst_index / App.canvas.width);

			// if overlap with logo do some blending
			if( dst_x >= App.logo_x && dst_x <= App.logo_x + App.logo_width &&
				dst_y >= App.logo_y && dst_y <= App.logo_y + App.logo_height ) {

				const src_color = rgba(App.buffer32[dst_index]);
				const dst_color = rgba(color);

				if(src_color.a === 0 || palette_index === 0) {
					dst_color.a = 255;
				}
				else if(palette_index < 4) {
					src_color.a = 192;
					dst_color.a = 63;
				}
				else if(palette_index < 8) {
					src_color.a = 127;
					dst_color.a = 128;
				}
				else if(palette_index < 16) {
					src_color.a = 63;
					dst_color.a = 192;
				}
				else if(palette_index < 24) {
					src_color.a = 31;
					dst_color.a = 224;
				}
				else {
					src_color.a = 0;
					dst_color.a = 255;
				}

				const blended = rgba_blend(src_color, dst_color);
				color = blended.r | (blended.g << 8) | (blended.b << 16) | (blended.a << 24);
			}

			App.buffer32[dst_index] = color;
			pixels_updated++;
        }
    }

	App.image_data.data.set(App.buffer8);
    App.ctx.putImageData(App.image_data, 0, 0);

	if( (App.frame_count % 10) === 0 ) {

		const time = performance.now();
		App.frame_per_seconds = Math.round( 1000 / (time - App.timer) * App.frame_count );
		App.timer = time;
		App.frame_count = 0;
	}
	App.ctx.fillText(`FPS: ${App.frame_per_seconds}`, 1, 12);
	App.frame_count++;
	requestAnimationFrame(loop);
}

function rgba(value) {
	return { r: value & 255, g: value >> 8 & 255, b: value >> 16 & 255, a: value >> 24 & 255};
}

function rgba_blend(src_color, dst_color) {
	const r1 = src_color.r * src_color.r;
	const r2 = dst_color.r * dst_color.r;
	const g1 = src_color.g * src_color.g;
	const g2 = dst_color.g * dst_color.g;
	const b1 = src_color.b * src_color.b;
	const b2 = dst_color.b * dst_color.b;
	const r = Math.sqrt( (r1 * src_color.a + r2 * dst_color.a) >> 8 );
	const g = Math.sqrt( (g1 * src_color.a + g2 * dst_color.a) >> 8 );
	const b = Math.sqrt( (b1 * src_color.a + b2 * dst_color.a) >> 8 );
	return { r: r, g: g, b: b, a: 255 };
}