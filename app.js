"use strict";

window.onload = ()=>{ setup(); };

const App = {
	canvas: null,
	ctx: null,
	image_data: null,
	buffer8: null,
	buffer32: null,
	data: null,
	starting: true,
	stopping: false,
	fire_palette_ratio: 3,
	timer: 0
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
	App.ctx.font = "20px Lucida Console";
	App.image_data = App.ctx.createImageData(App.canvas.width, App.canvas.height);

	const buffer = new ArrayBuffer(App.image_data.data.length);
	App.buffer8 = new Uint8ClampedArray(buffer);
	App.buffer32 = new Uint32Array(buffer);

	App.data = new Uint8ClampedArray(App.canvas.width * App.canvas.height);
	App.starting = true;
	App.stopping = false;
	App.fire_palette_ratio = 3;

	App.timer = performance.now;
	requestAnimationFrame(loop);
}

function start() {

	App.starting = true;
	App.stopping = false;
}

function stop() {
	App.starting = false;
	App.stopping = true;
}

function loop(timestamp) {

	let pixels_updated = 0;

	if(App.stopping === true) {
		for(let y = App.canvas.height - 20; y < App.canvas.height; y++) {  
			for(let x = 0; x < App.canvas.width; x++) {
				if(App.data[y * App.canvas.width + x] > 0) {
					App.data[y * App.canvas.width + x] -= Math.round(Math.random()) & 3;
				}
			}
		}
	}

	let starting_count = 0;
	if(App.starting === true) {
		for(let y = App.canvas.height - 7; y < App.canvas.height; y++) {  
			for(let x = 0; x < App.canvas.width; x++) {
				
				const index = y * App.canvas.width + x;
				if( App.data[index] < (palette.length * App.fire_palette_ratio - 1) ) {

					App.data[index] += Math.round(Math.random());
					const palette_index = Math.floor(App.data[index] / App.fire_palette_ratio);
					App.buffer32[index] = palette[palette_index];
					// App.image_data.data[index * 4 + 0] = palette[palette_index] & 255;
					// App.image_data.data[index * 4 + 1] = palette[palette_index] >> 8 & 255;
					// App.image_data.data[index * 4 + 2] = palette[palette_index] >> 16 & 255;
					// App.image_data.data[index * 4 + 3] = palette[palette_index] >> 24 & 255;
					pixels_updated++;
				}
				else {
					starting_count++;
				}
			}
		}

		if(starting_count > 50 * 7 * App.canvas.width) {
			App.starting = false;
			console.log("starting=false");
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
			App.buffer32[dst_index] = palette[palette_index];
			// App.image_data.data[dst_index * 4 + 0] = palette[palette_index] & 255;
			// App.image_data.data[dst_index * 4 + 1] = palette[palette_index] >> 8 & 255;
			// App.image_data.data[dst_index * 4 + 2] = palette[palette_index] >> 16 & 255;
			// App.image_data.data[dst_index * 4 + 3] = palette[palette_index] >> 24 & 255;
			pixels_updated++;
        }
    }

    App.image_data.data.set(App.buffer8);
    App.ctx.putImageData(App.image_data, 0, 0);

	const time = performance.now();
	const f = "Fps: " + Math.round(1000/(time - App.timer)) + " Pixels: " + pixels_updated;
	App.ctx.fillText(f, 1, 20);
	App.timer = time;
	requestAnimationFrame(loop);
}
