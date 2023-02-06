"use strict";

window.addEventListener('resize', update_size);

const App = {
	canvas: null,
	canvas_ctx: null,
	offscreen: null,
	offscreen_ctx: null,
	offscreen_data: null,		// offscreen image data
	offscreen_buffer8: null,
	offscreen_buffer32: null,
	scale: 4,
	data: null,					// array used for logic
	fire_is_starting: true,
	fire_is_stopping: false,
	fire_is_paused: false,
	fire_palette_ratio: 2,
	timer: 0,
	frame_count: 0,
	frame_per_seconds: 0,
	fps: null
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

init();

function init() {

	App.offscreen = document.createElement('canvas');
	App.offscreen_ctx = App.offscreen.getContext('2d', {alpha: false});

	App.canvas = document.getElementById('display');
	App.canvas_ctx = App.canvas.getContext('2d', {alpha: false});
	App.canvas_ctx.imageSmoothingEnabled = false;

	App.fps = document.getElementById('fps');

	update_size();

	requestAnimationFrame(loop);
}

function update_size(evt) {

	App.canvas.width = window.innerWidth;
	App.canvas.height = window.innerHeight;
	App.canvas_ctx.imageSmoothingEnabled = false;

	App.offscreen.width = Math.ceil(App.canvas.width / App.scale);
	App.offscreen.height = Math.ceil(App.canvas.height / App.scale);

	App.offscreen_data = App.offscreen_ctx.createImageData(App.offscreen.width, App.offscreen.height);
	const buffer = new ArrayBuffer(App.offscreen_data.data.length);
	App.offscreen_buffer8 = new Uint8ClampedArray(buffer);
	App.offscreen_buffer32 = new Uint32Array(buffer);

	App.data = new Uint8ClampedArray(App.offscreen.width * App.offscreen.height);
}

function loop(timestamp) {

	if(App.fire_is_paused === true) return;

	// fuel fire
	let starting_count = 0;
	if(App.fire_is_starting === true) {
		let index = (App.offscreen.height - 7) * App.offscreen.width;
		const count = App.offscreen.width * App.offscreen.height;
		while(index < count) {
			if( App.data[index] < (palette.length * App.fire_palette_ratio - 1) ) {
				App.data[index] += Math.round(Math.random());
			}
			else {
				starting_count++;
			}
			index++;
		}
		if(starting_count > 50 * 7 * App.offscreen.width) {
			App.fire_is_starting = false;
		}
	}

	// update fire
	for (let y = 1; y < App.offscreen.height; y++) {
		for (let x = 0; x < App.offscreen.width; x++) {

			const src_index = y * App.offscreen.width + x;
			if(App.data[src_index] < App.fire_palette_ratio - 1) continue;

			const direction = Math.round(Math.random() * 2) - 1;
			const dst_index = src_index - App.offscreen.width + direction;

			const decay = (Math.random() * 8) & 1;
			const dst_value = App.data[src_index] - decay;
			const palette_index = Math.floor(dst_value / App.fire_palette_ratio);

			App.data[dst_index] = dst_value;

			const color = palette[palette_index];
			App.offscreen_buffer32[dst_index] = color;
		}
	}

	App.offscreen_data.data.set(App.offscreen_buffer8);
	App.offscreen_ctx.putImageData(App.offscreen_data, 0, 0);
	App.canvas_ctx.drawImage(App.offscreen, 0, 0, App.canvas.width, App.canvas.height);

	if( (App.frame_count % 10) === 0 ) {

		const time = performance.now();
		App.frame_per_seconds = Math.round( 1000 / (time - App.timer) * App.frame_count );
		App.timer = time;
		App.frame_count = 0;
	}
	App.fps.innerHTML = `FPS: ${App.frame_per_seconds}`;

	App.frame_count++;

	requestAnimationFrame(loop);
}
