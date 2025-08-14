export class Matrix {
  rows: number;
  cols: number;
  data: number[][];

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.data = [];
    for (let i = 0; i < rows; i++) {
      this.data[i] = [];
      for (let j = 0; j < cols; j++) {
        this.data[i][j] = 0;
      }
    }
  }

  static fromArray(arr: number[]): Matrix {
    const matrix = new Matrix(arr.length, 1);
    for (let i = 0; i < arr.length; i++) {
      matrix.data[i][0] = arr[i];
    }
    return matrix;
  }

  toArray(): number[] {
    const arr: number[] = [];
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        arr.push(this.data[i][j]);
      }
    }
    return arr;
  }

  randomize(): void {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        this.data[i][j] = Math.random() * 2 - 1; // Random between -1 and 1
      }
    }
  }

  static multiply(a: Matrix, b: Matrix): Matrix {
    if (a.cols !== b.rows) {
      throw new Error('Matrix dimensions do not match for multiplication');
    }
    
    const result = new Matrix(a.rows, b.cols);
    for (let i = 0; i < result.rows; i++) {
      for (let j = 0; j < result.cols; j++) {
        let sum = 0;
        for (let k = 0; k < a.cols; k++) {
          sum += a.data[i][k] * b.data[k][j];
        }
        result.data[i][j] = sum;
      }
    }
    return result;
  }

  static subtract(a: Matrix, b: Matrix): Matrix {
    if (a.rows !== b.rows || a.cols !== b.cols) {
      throw new Error('Matrix dimensions do not match for subtraction');
    }
    
    const result = new Matrix(a.rows, a.cols);
    for (let i = 0; i < a.rows; i++) {
      for (let j = 0; j < a.cols; j++) {
        result.data[i][j] = a.data[i][j] - b.data[i][j];
      }
    }
    return result;
  }

  static transpose(matrix: Matrix): Matrix {
    const result = new Matrix(matrix.cols, matrix.rows);
    for (let i = 0; i < matrix.rows; i++) {
      for (let j = 0; j < matrix.cols; j++) {
        result.data[j][i] = matrix.data[i][j];
      }
    }
    return result;
  }

  static hadamard(a: Matrix, b: Matrix): Matrix {
    if (a.rows !== b.rows || a.cols !== b.cols) {
      throw new Error('Matrix dimensions do not match for Hadamard product');
    }
    
    const result = new Matrix(a.rows, a.cols);
    for (let i = 0; i < a.rows; i++) {
      for (let j = 0; j < a.cols; j++) {
        result.data[i][j] = a.data[i][j] * b.data[i][j];
      }
    }
    return result;
  }

  scale(scalar: number): Matrix {
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[i][j] = this.data[i][j] * scalar;
      }
    }
    return result;
  }

  static add(a: Matrix, b: Matrix): Matrix {
    if (a.rows !== b.rows || a.cols !== b.cols) {
      throw new Error('Matrix dimensions do not match for addition');
    }
    
    const result = new Matrix(a.rows, a.cols);
    for (let i = 0; i < a.rows; i++) {
      for (let j = 0; j < a.cols; j++) {
        result.data[i][j] = a.data[i][j] + b.data[i][j];
      }
    }
    return result;
  }

  map(func: (val: number) => number): Matrix {
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[i][j] = func(this.data[i][j]);
      }
    }
    return result;
  }

  copy(): Matrix {
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[i][j] = this.data[i][j];
      }
    }
    return result;
  }
}

// Activation functions
export class ActivationFunctions {
  static sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  static sigmoidDerivative(x: number): number {
    const sig = ActivationFunctions.sigmoid(x);
    return sig * (1 - sig);
  }

  static relu(x: number): number {
    return Math.max(0, x);
  }

  static reluDerivative(x: number): number {
    return x > 0 ? 1 : 0;
  }

  static tanh(x: number): number {
    return Math.tanh(x);
  }

  static tanhDerivative(x: number): number {
    const t = Math.tanh(x);
    return 1 - t * t;
  }

  static leakyRelu(x: number): number {
    return x > 0 ? x : 0.01 * x;
  }

  static leakyReluDerivative(x: number): number {
    return x > 0 ? 1 : 0.01;
  }
}

export interface LayerConfig {
  neurons: number;
  activation: 'sigmoid' | 'relu' | 'tanh' | 'leakyRelu';
}

export interface TrainingData {
  input: number[];
  output: number[];
}

export interface TrainingOptions {
  learningRate: number;
  epochs: number;
  batchSize?: number;
  verbose?: boolean;
}

export class NeuralNetwork {
  layers: LayerConfig[];
  weights: Matrix[];
  biases: Matrix[];
  totalWeights: number;
  
  // Store activations and z-values for backpropagation
  private activations: Matrix[];
  private zValues: Matrix[];

  constructor(inputSize: number, layers: LayerConfig[]) {
    this.layers = layers;
    this.weights = [];
    this.biases = [];
    this.activations = [];
    this.zValues = [];
    this.totalWeights = 0;

    // Initialize weights and biases
    let prevSize = inputSize;
    
    for (let i = 0; i < layers.length; i++) {
      const currentSize = layers[i].neurons;
      
      // Weight matrix from previous layer to current layer
      // Use Xavier/Glorot initialization for better convergence
      const weight = new Matrix(currentSize, prevSize);
      const scale = Math.sqrt(2.0 / (prevSize + currentSize));
      weight.randomize();
      // Scale weights for better initialization
      for (let j = 0; j < weight.rows; j++) {
        for (let k = 0; k < weight.cols; k++) {
          weight.data[j][k] *= scale;
        }
      }
      this.weights.push(weight);
      
      // Bias vector for current layer (initialized to small values)
      const bias = new Matrix(currentSize, 1);
      for (let j = 0; j < bias.rows; j++) {
        bias.data[j][0] = (Math.random() - 0.5) * 0.1;
      }
      this.biases.push(bias);
      
      // Count total weights
      this.totalWeights += (currentSize * prevSize) + currentSize;
      
      prevSize = currentSize;
    }

    console.log(`Neural Network created with ${this.totalWeights} total weights`);
  }

  predict(input: number[]): number[] {
    return this.forwardPass(input, false);
  }

  // Forward pass with option to store intermediate values for training
  private forwardPass(input: number[], storeValues: boolean = false): number[] {
    if (input.length !== this.getInputSize()) {
      throw new Error(`Input size mismatch. Expected ${this.getInputSize()}, got ${input.length}`);
    }

    if (storeValues) {
      this.activations = [];
      this.zValues = [];
    }

    let current = Matrix.fromArray(input);
    
    if (storeValues) {
      this.activations.push(current.copy()); // Store input as first activation
    }

    // Forward propagation through all layers
    for (let i = 0; i < this.layers.length; i++) {
      // Linear transformation: W * x + b
      const z = Matrix.add(Matrix.multiply(this.weights[i], current), this.biases[i]);
      
      if (storeValues) {
        this.zValues.push(z.copy());
      }
      
      // Apply activation function
      const activation = this.getActivationFunction(this.layers[i].activation);
      current = z.map(activation);
      
      if (storeValues) {
        this.activations.push(current.copy());
      }
    }

    return current.toArray();
  }

  // Train the network using backpropagation
  train(trainingData: TrainingData[], options: TrainingOptions): number[] {
    const { learningRate, epochs, batchSize = trainingData.length, verbose = false } = options;
    const losses: number[] = [];

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      let batches = 0;

      // Process data in batches
      for (let i = 0; i < trainingData.length; i += batchSize) {
        const batch = trainingData.slice(i, i + batchSize);
        const batchLoss = this.trainBatch(batch, learningRate);
        totalLoss += batchLoss;
        batches++;
      }

      const avgLoss = totalLoss / batches;
      losses.push(avgLoss);

      if (verbose && (epoch % 100 === 0 || epoch === epochs - 1)) {
        console.log(`Epoch ${epoch + 1}/${epochs}, Loss: ${avgLoss.toFixed(6)}`);
      }
    }

    return losses;
  }

  // Train a single batch using backpropagation
  private trainBatch(batch: TrainingData[], learningRate: number): number {
    // Initialize gradient accumulators
    const weightGradients: Matrix[] = this.weights.map(w => new Matrix(w.rows, w.cols));
    const biasGradients: Matrix[] = this.biases.map(b => new Matrix(b.rows, b.cols));
    
    let totalLoss = 0;

    // Process each example in the batch
    for (const example of batch) {
      // Forward pass
      const output = this.forwardPass(example.input, true);
      
      // Calculate loss (mean squared error)
      const target = Matrix.fromArray(example.output);
      const prediction = Matrix.fromArray(output);
      const error = Matrix.subtract(prediction, target);
      
      // Calculate loss for this example
      const loss = error.toArray().reduce((sum, val) => sum + val * val, 0) / 2;
      totalLoss += loss;

      // Backward pass
      this.backpropagate(error, weightGradients, biasGradients);
    }

    // Update weights and biases using accumulated gradients
    const batchSize = batch.length;
    for (let i = 0; i < this.weights.length; i++) {
      // Average the gradients and apply learning rate
      const avgWeightGrad = weightGradients[i].scale(learningRate / batchSize);
      const avgBiasGrad = biasGradients[i].scale(learningRate / batchSize);
      
      // Update weights and biases
      this.weights[i] = Matrix.subtract(this.weights[i], avgWeightGrad);
      this.biases[i] = Matrix.subtract(this.biases[i], avgBiasGrad);
    }

    return totalLoss / batch.length;
  }

  // Backpropagation algorithm
  private backpropagate(outputError: Matrix, weightGradients: Matrix[], biasGradients: Matrix[]): void {
    let delta = outputError.copy();

    // Backpropagate through layers (reverse order)
    for (let i = this.layers.length - 1; i >= 0; i--) {
      // Get activation derivative
      const activationDerivative = this.getActivationDerivative(this.layers[i].activation);
      const zDerivative = this.zValues[i].map(activationDerivative);
      
      // Calculate delta for this layer
      delta = Matrix.hadamard(delta, zDerivative);
      
      // Calculate gradients
      const prevActivation = this.activations[i]; // Previous layer's activation (or input)
      const weightGrad = Matrix.multiply(delta, Matrix.transpose(prevActivation));
      const biasGrad = delta.copy();
      
      // Accumulate gradients
      weightGradients[i] = Matrix.add(weightGradients[i], weightGrad);
      biasGradients[i] = Matrix.add(biasGradients[i], biasGrad);
      
      // Calculate delta for previous layer (if not input layer)
      if (i > 0) {
        delta = Matrix.multiply(Matrix.transpose(this.weights[i]), delta);
      }
    }
  }

  private getInputSize(): number {
    return this.weights[0].cols;
  }

  private getActivationFunction(type: string): (x: number) => number {
    switch (type) {
      case 'sigmoid':
        return ActivationFunctions.sigmoid;
      case 'relu':
        return ActivationFunctions.relu;
      case 'tanh':
        return ActivationFunctions.tanh;
      case 'leakyRelu':
        return ActivationFunctions.leakyRelu;
      default:
        return ActivationFunctions.relu;
    }
  }

  private getActivationDerivative(type: string): (x: number) => number {
    switch (type) {
      case 'sigmoid':
        return ActivationFunctions.sigmoidDerivative;
      case 'relu':
        return ActivationFunctions.reluDerivative;
      case 'tanh':
        return ActivationFunctions.tanhDerivative;
      case 'leakyRelu':
        return ActivationFunctions.leakyReluDerivative;
      default:
        return ActivationFunctions.reluDerivative;
    }
  }

  // Evaluate network performance on test data
  evaluate(testData: TrainingData[]): { accuracy: number; loss: number } {
    let correctPredictions = 0;
    let totalLoss = 0;

    for (const example of testData) {
      const output = this.predict(example.input);
      const target = example.output;

      // Calculate loss
      const loss = output.reduce((sum, val, idx) => sum + Math.pow(val - target[idx], 2), 0) / 2;
      totalLoss += loss;

      // For classification, check if prediction is correct (using argmax)
      if (output.length > 1) {
        const predictedClass = output.indexOf(Math.max(...output));
        const actualClass = target.indexOf(Math.max(...target));
        if (predictedClass === actualClass) {
          correctPredictions++;
        }
      } else {
        // For regression or binary classification, use threshold
        const predicted = output[0] > 0.5 ? 1 : 0;
        const actual = target[0] > 0.5 ? 1 : 0;
        if (predicted === actual) {
          correctPredictions++;
        }
      }
    }

    return {
      accuracy: correctPredictions / testData.length,
      loss: totalLoss / testData.length
    };
  }

  // Get network architecture info
  getArchitecture(): string {
    const inputSize = this.getInputSize();
    const layerSizes = this.layers.map(layer => `${layer.neurons}(${layer.activation})`);
    return `${inputSize} → ${layerSizes.join(' → ')}`;
  }

  // Get total parameter count
  getTotalWeights(): number {
    return this.totalWeights;
  }

  // Copy network
  copy(): NeuralNetwork {
    const copy = new NeuralNetwork(this.getInputSize(), this.layers);
    
    for (let i = 0; i < this.weights.length; i++) {
      copy.weights[i] = this.weights[i].copy();
      copy.biases[i] = this.biases[i].copy();
    }
    
    return copy;
  }

  // Serialize network to JSON
  toJSON(): string {
    return JSON.stringify({
      layers: this.layers,
      weights: this.weights.map(w => w.data),
      biases: this.biases.map(b => b.data)
    });
  }

  // Load network from JSON
  static fromJSON(json: string): NeuralNetwork {
    const data = JSON.parse(json);
    const inputSize = data.weights[0][0].length;
    const network = new NeuralNetwork(inputSize, data.layers);
    
    for (let i = 0; i < data.weights.length; i++) {
      network.weights[i].data = data.weights[i];
      network.biases[i].data = data.biases[i];
    }
    
    return network;
  }
}

// Factory function to create common network architectures
export class NetworkFactory {
  // Create a deep network for Quarto game evaluation
  static createQuartoEvaluator(): NeuralNetwork {
    // Input: 16 board positions * 4 attributes + 16 available pieces * 4 attributes = 128 inputs
    const inputSize = 128;
    
    const layers: LayerConfig[] = [
      { neurons: 256, activation: 'relu' },      // Layer 1: 256 neurons
      { neurons: 128, activation: 'relu' },      // Layer 2: 128 neurons  
      { neurons: 64, activation: 'relu' },       // Layer 3: 64 neurons
      { neurons: 32, activation: 'relu' },       // Layer 4: 32 neurons
      { neurons: 16, activation: 'relu' },       // Layer 5: 16 neurons
      { neurons: 8, activation: 'relu' },        // Layer 6: 8 neurons
      { neurons: 4, activation: 'tanh' },        // Layer 7: 4 neurons
      { neurons: 1, activation: 'sigmoid' }      // Layer 8: 1 output (position evaluation)
    ];

    return new NeuralNetwork(inputSize, layers);
  }

  // Create a smaller network for faster computation
  static createFastEvaluator(): NeuralNetwork {
    const inputSize = 64; // Simplified input representation
    
    const layers: LayerConfig[] = [
      { neurons: 128, activation: 'relu' },
      { neurons: 64, activation: 'relu' },
      { neurons: 32, activation: 'relu' },
      { neurons: 16, activation: 'relu' },
      { neurons: 8, activation: 'tanh' },
      { neurons: 4, activation: 'tanh' },
      { neurons: 2, activation: 'tanh' },
      { neurons: 1, activation: 'sigmoid' }
    ];

    return new NeuralNetwork(inputSize, layers);
  }

  // Create a demo XOR network
  static createXORNetwork(): NeuralNetwork {
    const layers: LayerConfig[] = [
      { neurons: 4, activation: 'relu' },
      { neurons: 4, activation: 'relu' },
      { neurons: 3, activation: 'relu' },
      { neurons: 3, activation: 'tanh' },
      { neurons: 2, activation: 'tanh' },
      { neurons: 2, activation: 'tanh' },
      { neurons: 1, activation: 'tanh' },
      { neurons: 1, activation: 'sigmoid' }
    ];

    return new NeuralNetwork(2, layers);
  }
}