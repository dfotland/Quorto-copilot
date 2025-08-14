import { NeuralNetwork, NetworkFactory, type TrainingData } from './NeuralNetwork';

export class NeuralNetworkDemo {
  static runDemo(): void {
    console.log('🧠 Neural Network Demo Starting...\n');

    // Create different network architectures
    const quartoNet = NetworkFactory.createQuartoEvaluator();
    const fastNet = NetworkFactory.createFastEvaluator();
    const xorNet = NetworkFactory.createXORNetwork();

    console.log('📊 Network Architectures Created:');
    console.log(`1. Quarto Evaluator: ${quartoNet.getArchitecture()}`);
    console.log(`   Total Weights: ${quartoNet.getTotalWeights()}`);
    console.log(`2. Fast Evaluator: ${fastNet.getArchitecture()}`);
    console.log(`   Total Weights: ${fastNet.getTotalWeights()}`);
    console.log(`3. XOR Network: ${xorNet.getArchitecture()}`);
    console.log(`   Total Weights: ${xorNet.getTotalWeights()}\n`);

    // Train XOR network
    console.log('🎓 Training XOR Network:');
    const xorTrainingData: TrainingData[] = [
      { input: [0, 0], output: [0] },
      { input: [0, 1], output: [1] },
      { input: [1, 0], output: [1] },
      { input: [1, 1], output: [0] }
    ];

    // Test before training
    console.log('Before training:');
    xorTrainingData.forEach(data => {
      const output = xorNet.predict(data.input);
      console.log(`XOR(${data.input[0]}, ${data.input[1]}) = ${output[0].toFixed(4)} (target: ${data.output[0]})`);
    });

    // Train the network
    const trainStart = performance.now();
    const losses = xorNet.train(xorTrainingData, {
      learningRate: 0.1,
      epochs: 1000,
      verbose: false
    });
    const trainEnd = performance.now();

    console.log(`\nTraining completed in ${(trainEnd - trainStart).toFixed(2)}ms`);
    console.log(`Final loss: ${losses[losses.length - 1].toFixed(6)}`);

    // Test after training
    console.log('\nAfter training:');
    const evaluation = xorNet.evaluate(xorTrainingData);
    xorTrainingData.forEach(data => {
      const output = xorNet.predict(data.input);
      const error = Math.abs(output[0] - data.output[0]);
      console.log(`XOR(${data.input[0]}, ${data.input[1]}) = ${output[0].toFixed(4)} (target: ${data.output[0]}, error: ${error.toFixed(4)})`);
    });
    console.log(`Accuracy: ${(evaluation.accuracy * 100).toFixed(1)}%`);

    // Test Quarto network with sample input
    console.log('\n🎮 Testing Quarto Evaluator:');
    const sampleQuartoInput = new Array(128).fill(0).map(() => Math.random());
    const start = performance.now();
    const quartoOutput = quartoNet.predict(sampleQuartoInput);
    const end = performance.now();
    console.log(`Board evaluation: ${quartoOutput[0].toFixed(4)}`);
    console.log(`Prediction time: ${(end - start).toFixed(2)}ms`);

    // Test fast network
    console.log('\n⚡ Testing Fast Evaluator:');
    const sampleFastInput = new Array(64).fill(0).map(() => Math.random());
    const fastStart = performance.now();
    const fastOutput = fastNet.predict(sampleFastInput);
    const fastEnd = performance.now();
    console.log(`Board evaluation: ${fastOutput[0].toFixed(4)}`);
    console.log(`Prediction time: ${(fastEnd - fastStart).toFixed(2)}ms`);

    // Test serialization
    console.log('\n💾 Testing Serialization:');
    const networkJson = xorNet.toJSON();
    const loadedNetwork = NeuralNetwork.fromJSON(networkJson);
    const loadedOutput = loadedNetwork.predict([1, 0]);
    const originalOutput = xorNet.predict([1, 0]);
    console.log(`Original network XOR(1, 0): ${originalOutput[0].toFixed(4)}`);
    console.log(`Loaded network XOR(1, 0): ${loadedOutput[0].toFixed(4)}`);
    console.log(`Serialization successful: ${originalOutput[0].toFixed(4) === loadedOutput[0].toFixed(4)}`);

    // Demonstrate training on a simple pattern
    console.log('\n� Training Simple Pattern Recognition:');
    const patternNet = NetworkFactory.createXORNetwork();
    const patternData: TrainingData[] = [
      { input: [0.1, 0.1], output: [0.2] },
      { input: [0.9, 0.1], output: [0.8] },
      { input: [0.1, 0.9], output: [0.8] },
      { input: [0.9, 0.9], output: [0.1] }
    ];

    console.log('Before training pattern:');
    patternData.forEach((data, i) => {
      const output = patternNet.predict(data.input);
      console.log(`Pattern ${i + 1}: ${output[0].toFixed(4)} (target: ${data.output[0]})`);
    });

    patternNet.train(patternData, {
      learningRate: 0.1,
      epochs: 500,
      verbose: false
    });

    console.log('After training pattern:');
    patternData.forEach((data, i) => {
      const output = patternNet.predict(data.input);
      const error = Math.abs(output[0] - data.output[0]);
      console.log(`Pattern ${i + 1}: ${output[0].toFixed(4)} (target: ${data.output[0]}, error: ${error.toFixed(4)})`);
    });

    console.log('\n✅ Neural Network Demo Complete!');
  }

  static benchmarkPerformance(): void {
    console.log('\n🏃‍♂️ Performance Benchmark Starting...');
    
    const network = NetworkFactory.createQuartoEvaluator();
    const input = new Array(128).fill(0).map(() => Math.random());
    const iterations = 1000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      network.predict(input);
    }
    const end = performance.now();

    const totalTime = end - start;
    const avgTime = totalTime / iterations;
    const predictionsPerSecond = 1000 / avgTime;

    console.log(`📈 Benchmark Results:`);
    console.log(`Total time for ${iterations} predictions: ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per prediction: ${avgTime.toFixed(4)}ms`);
    console.log(`Predictions per second: ${predictionsPerSecond.toFixed(0)}`);
    console.log(`Network weights: ${network.getTotalWeights()}`);
  }
}