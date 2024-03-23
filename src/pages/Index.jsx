import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Flex, Grid, Heading, Text, useInterval, VStack } from "@chakra-ui/react";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const SHAPES = [
  // Define the shapes of the tetrominoes
  // Example: [[1, 1, 1, 1]], // I shape
];

const Index = () => {
  const [board, setBoard] = useState(Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => 0)));
  const [currentPiece, setCurrentPiece] = useState(null);
  const [currentPosition, setCurrentPosition] = useState({ row: 0, col: 0 });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [nextPiece, setNextPiece] = useState(null);
  const [highScores, setHighScores] = useState([]);

  const boardRef = useRef(null);

  useEffect(() => {
    // Initialize the game
    resetGame();
  }, []);

  useInterval(
    () => {
      // Move the current piece down by one row
      moveDown();
    },
    isPaused || gameOver ? null : 1000 / level,
  );

  const resetGame = () => {
    setBoard(Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => 0)));
    setCurrentPiece(null);
    setCurrentPosition({ row: 0, col: 0 });
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setNextPiece(getRandomPiece());
    generateNewPiece();
  };

  const getRandomPiece = () => {
    // Get a random tetromino shape
    const randomIndex = Math.floor(Math.random() * SHAPES.length);
    return SHAPES[randomIndex];
  };

  const generateNewPiece = () => {
    // Generate a new piece and set it as the current piece
    setCurrentPiece(nextPiece);
    setNextPiece(getRandomPiece());
    setCurrentPosition({ row: 0, col: Math.floor(BOARD_WIDTH / 2) - 1 });

    if (hasCollision(nextPiece, { row: 0, col: Math.floor(BOARD_WIDTH / 2) - 1 })) {
      setGameOver(true);
    }
  };

  const hasCollision = (piece, position) => {
    // Check if the piece collides with the board or other pieces
    for (let row = 0; row < piece.length; row++) {
      for (let col = 0; col < piece[row].length; col++) {
        if (piece[row][col] && (board[row + position.row] === undefined || board[row + position.row][col + position.col] === undefined || board[row + position.row][col + position.col])) {
          return true;
        }
      }
    }
    return false;
  };

  const rotatePiece = () => {
    // Rotate the current piece by 90 degrees
    const rotatedPiece = currentPiece[0].map((_, index) => currentPiece.map((row) => row[index]).reverse());

    if (!hasCollision(rotatedPiece, currentPosition)) {
      setCurrentPiece(rotatedPiece);
    }
  };

  const moveLeft = () => {
    // Move the current piece to the left by one column
    const newPosition = { ...currentPosition, col: currentPosition.col - 1 };

    if (currentPosition.col > 0 && !hasCollision(currentPiece, newPosition)) {
      setCurrentPosition(newPosition);
    }
  };

  const moveRight = () => {
    // Move the current piece to the right by one column
    const newPosition = { ...currentPosition, col: currentPosition.col + 1 };

    if (currentPosition.col < BOARD_WIDTH - currentPiece[0].length && !hasCollision(currentPiece, newPosition)) {
      setCurrentPosition(newPosition);
    }
  };

  const moveDown = () => {
    // Move the current piece down by one row
    const newPosition = { ...currentPosition, row: currentPosition.row + 1 };

    if (!hasCollision(currentPiece, newPosition)) {
      setCurrentPosition(newPosition);
    } else {
      mergePiece();
      generateNewPiece();
    }
  };

  const mergePiece = () => {
    // Merge the current piece with the board
    const newBoard = [...board];
    for (let row = 0; row < currentPiece.length; row++) {
      for (let col = 0; col < currentPiece[row].length; col++) {
        if (currentPiece[row][col]) {
          newBoard[currentPosition.row + row][currentPosition.col + col] = currentPiece[row][col];
        }
      }
    }
    setBoard(newBoard);
    clearCompletedRows(newBoard);
  };

  const clearCompletedRows = (newBoard) => {
    // Clear completed rows and update the score
    let rowsCleared = 0;
    const updatedBoard = newBoard.filter((row) => {
      if (row.every((cell) => cell !== 0)) {
        rowsCleared++;
        return false;
      }
      return true;
    });

    if (rowsCleared > 0) {
      setScore((prevScore) => prevScore + rowsCleared * 10);
      setBoard([...Array.from({ length: rowsCleared }, () => Array.from({ length: BOARD_WIDTH }, () => 0)), ...updatedBoard]);
    }
  };

  const handleKeyDown = (event) => {
    // Handle keyboard events for piece movement and rotation
    if (!isPaused && !gameOver) {
      switch (event.keyCode) {
        case 37: // Left arrow
          moveLeft();
          break;
        case 39: // Right arrow
          moveRight();
          break;
        case 40: // Down arrow
          moveDown();
          break;
        case 38: // Up arrow
          rotatePiece();
          break;
      }
    }
  };

  const togglePause = () => {
    // Toggle the pause state of the game
    setIsPaused(!isPaused);
  };

  const saveHighScore = () => {
    // Save the high score to local storage
    const newHighScores = [...highScores, score].sort((a, b) => b - a).slice(0, 5);
    setHighScores(newHighScores);
    localStorage.setItem("highScores", JSON.stringify(newHighScores));
  };

  useEffect(() => {
    // Load high scores from local storage
    const storedHighScores = localStorage.getItem("highScores");
    if (storedHighScores) {
      setHighScores(JSON.parse(storedHighScores));
    }
  }, []);

  useEffect(() => {
    // Update the level based on the score
    setLevel(Math.floor(score / 100) + 1);
  }, [score]);

  useEffect(() => {
    // Save the high score when the game is over
    if (gameOver) {
      saveHighScore();
    }
  }, [gameOver]);

  return (
    <Flex direction="column" align="center" justify="center" minHeight="100vh">
      <Heading as="h1" size="2xl" mb={8}>
        Tetris
      </Heading>
      <Flex>
        <Box ref={boardRef} mr={8}>
          <Grid templateColumns={`repeat(${BOARD_WIDTH}, 1fr)`} gap={1} bg="gray.100" p={2} borderRadius="md">
            {board.map((row, rowIndex) => row.map((cell, colIndex) => <Box key={`${rowIndex}-${colIndex}`} width={8} height={8} bg={cell ? "teal.500" : "gray.300"} borderRadius="sm" />))}
          </Grid>
        </Box>
        <VStack spacing={4} align="flex-start">
          <Box borderWidth={2} borderRadius="md" p={4}>
            <Heading as="h2" size="lg" mb={2}>
              Next Piece
            </Heading>
            <Grid templateColumns={`repeat(${nextPiece[0].length}, 1fr)`} gap={1}>
              {nextPiece.map((row, rowIndex) => row.map((cell, colIndex) => <Box key={`${rowIndex}-${colIndex}`} width={6} height={6} bg={cell ? "teal.500" : "gray.300"} borderRadius="sm" />))}
            </Grid>
          </Box>
          <Box>
            <Text fontSize="xl" fontWeight="bold">
              Score: {score}
            </Text>
            <Text fontSize="xl" fontWeight="bold">
              Level: {level}
            </Text>
          </Box>
          <VStack spacing={2}>
            <Button colorScheme="teal" size="sm" onClick={togglePause} disabled={gameOver}>
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button colorScheme="red" size="sm" onClick={resetGame} disabled={!gameOver && !isPaused}>
              New Game
            </Button>
          </VStack>
          <Box mt={8}>
            <Heading as="h2" size="lg" mb={2}>
              High Scores
            </Heading>
            <VStack spacing={2} align="flex-start">
              {highScores.map((highScore, index) => (
                <Text key={index} fontSize="lg">
                  {index + 1}. {highScore}
                </Text>
              ))}
            </VStack>
          </Box>
        </VStack>
      </Flex>
    </Flex>
  );
};

export default Index;
