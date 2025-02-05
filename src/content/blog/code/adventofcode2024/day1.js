// Part 1 solution
export function solvePart1(input) {
    // Parse input
    const numbers = input.split('\n').map(Number);
    
    // Your solution logic
    const result = numbers.reduce((sum, n) => sum + n, 0);
    
    return result;
}