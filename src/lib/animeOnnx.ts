import * as ort from 'onnxruntime-web';

// Serve WASM locally (copied from node_modules/onnxruntime-web/dist).
ort.env.wasm.wasmPaths = '/ort/';

const sessions: Record<string, ort.InferenceSession> = {};

/** Load (and cache) an ONNX model by its file stem, e.g. 'Hayao' → /models/Hayao.onnx. */
export async function getSession(model: string): Promise<ort.InferenceSession> {
  if (!sessions[model]) {
    sessions[model] = await ort.InferenceSession.create(`/models/${model}.onnx`);
  }
  return sessions[model];
}

export interface InferenceResult {
  data: Float32Array;
  width: number;
  height: number;
}

export async function runAnime(
  session: ort.InferenceSession,
  input: Float32Array,
  width: number,
  height: number,
): Promise<InferenceResult> {
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  // AnimeGANv2 ONNX uses NHWC layout [1, H, W, 3].
  const tensor = new ort.Tensor('float32', input, [1, height, width, 3]);
  const results = await session.run({ [inputName]: tensor });
  const output = results[outputName];
  const dims = output.dims;
  // NHWC output [1, H, W, 3] → width = dims[2], height = dims[1].
  return {
    data: output.data as Float32Array,
    width: dims[2] ?? width,
    height: dims[1] ?? height,
  };
}
