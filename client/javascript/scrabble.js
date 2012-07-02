/*
  Coding Exercise: multiplayer online Scrabble(tm) clone written in
  modern HTML, CSS, and JavaScript

  IMPORTANT COPYRIGHT NOTICE:

  SCRABBLE® is a registered trademark. All intellectual property
  rights in and to the game are owned in the U.S.A and Canada by
  Hasbro Inc., and throughout the rest of the world by J.W. Spear &
  Sons Limited of Maidenhead, Berkshire, England, a subsidiary of
  Mattel Inc.

  This experimental project is not associated with any of the owners
  of the Scrabble brand.

*/

/*
  Useful references:

  http://en.wikipedia.org/wiki/Scrabble_letter_distributions

  http://en.wikipedia.org/wiki/Scrabble
  http://fr.wikipedia.org/wiki/Scrabble

  http://www.hasbro.com/scrabble/en_US/glossary.cfm
  http://www.hasbro.com/scrabble/en_US/rulesSetup.cfm

*/

/*
  Similar HTML/Javascript projects:

  http://www.themaninblue.com/writing/perspective/2004/01/27/

  http://code.google.com/p/scrabbly/source/browse/trunk/scrabble.js
*/

if (typeof triggerEvent == 'undefined') {
    triggerEvent = function() {
        console.log.apply(console, arguments);
    }
}

function MakeBoardArray()
{
    var retval = new Array(15);
    for (var x = 0; x < 15; x++) {
        retval[x] = new Array(15);
    }
    return retval;
}

function calculateMove(squares)
{
    // Check that the start field is occupied
    if (!squares[7][7].Tile) {
        return { error: "start field must be used" };
    }
    
    // Determine that the placement of the Tile(s) is legal
    
    // Find top-leftmost placed tile
    var x;
    var y;
    var topLeftX;
    var topLeftY;
    var tile;
    for (y = 0; !tile && y < 15; y++) {
        for (x = 0; !tile && x < 15; x++) {
            if (squares[x][y].Tile && !squares[x][y].TileLocked) {
                tile = squares[x][y].Tile;
                topLeftX = x;
                topLeftY = y;
            }
        }
    }
    if (!tile) {
        return { error: "no new tile found" };
    }
    
    // Remember which newly placed tile positions are legal
    var legalPlacements = MakeBoardArray();
    legalPlacements[topLeftX][topLeftY] = true;

    function touchingOld(x, y) {
        var retval = 
        (x > 0 && squares[x - 1][y].Tile && squares[x - 1][y].TileLocked)
            || (x < 14 && squares[x + 1][y].Tile && squares[x + 1][y].TileLocked)
            || (y > 0 && squares[x][y - 1].Tile && squares[x][y - 1].TileLocked)
            || (y < 14 && squares[x][y + 1].Tile && squares[x][y + 1].TileLocked);
        return retval;
    }

    var isTouchingOld = touchingOld(topLeftX, topLeftY);
    var horizontal = false;
    for (var x = topLeftX + 1; x < 15; x++) {
        if (!squares[x][topLeftY].Tile) {
            break;
        } else if (!squares[x][topLeftY].TileLocked) {
            legalPlacements[x][topLeftY] = true;
            horizontal = true;
            isTouchingOld = isTouchingOld || touchingOld(x, topLeftY);
        }
    }

    if (!horizontal) {
        for (var y = topLeftY + 1; y < 15; y++) {
            if (!squares[topLeftX][y].Tile) {
                break;
            } else if (!squares[topLeftX][y].TileLocked) {
                legalPlacements[topLeftX][y] = true;
                isTouchingOld = isTouchingOld || touchingOld(topLeftX, y);
            }
        }
    }

    if (!isTouchingOld && !legalPlacements[7][7]) {
        return { error: 'not touching old tile ' + topLeftX + '/' + topLeftY };
    }

    // Check whether there are any unconnected other placements 
    for (var x = 0; x < 15; x++) {
        for (var y = 0; y < 15; y++) {
            var square = squares[x][y];
            if (square.Tile && !square.TileLocked && !legalPlacements[x][y]) {
                return { error: 'unconnected placement' };
            }
        }
    }

    var move = { words: [] };

    // The move was legal, calculate scores
    function horizontalWordScores(squares) {
        var score = 0;
        for (var y = 0; y < 15; y++) {
            for (var x = 0; x < 14; x++) {
                if (squares[x][y].Tile && squares[x + 1][y].Tile) {
                    var wordScore = 0;
                    var letters = '';
                    var wordMultiplier = 1;
                    var isNewWord = false;
                    for (; x < 15 && squares[x][y].Tile; x++) {
                        var square = squares[x][y];
                        var letterScore = square.Tile.Score;
                        isNewWord = isNewWord || !square.TileLocked;
                        if (!square.TileLocked) {
                            switch (square.Type) {
                            case SquareType.DoubleLetter:
                                letterScore *= 2;
                                break;
                            case SquareType.TripleLetter:
                                letterScore *= 3;
                                break;
                            case SquareType.DoubleWord:
                                wordMultiplier *= 2;
                                break;
                            case SquareType.TripleWord:
                                wordMultiplier *= 3;
                                break;
                            }
                        }
                        wordScore += letterScore;
                        letters += square.Tile.Letter;
                    }
                    wordScore *= wordMultiplier;
                    if (isNewWord) {
                        console.log("word: [" + letters + "] score " + wordScore);
                        move.words.push({ word: letters, score: wordScore });
                        score += wordScore;
                    }
                }
            }
        }
        return score;
    }

    move.score = horizontalWordScores(squares);
    // Create rotated version of the board to calculate vertical word scores.
    var rotatedSquares = MakeBoardArray();
    for (var x = 0; x < 15; x++) {
        for (var y = 0; y < 15; y++) {
            rotatedSquares[x][y] = squares[y][x];
        }
    }
    move.score += horizontalWordScores(rotatedSquares);

    // Collect and count tiles placed.
    var tilesPlaced = [];
    for (var x = 0; x < 15; x++) {
        for (var y = 0; y < 15; y++) {
            var square = squares[x][y];
            if (square.Tile && !square.TileLocked) {
                tilesPlaced.push({ Letter: square.Tile.Letter,
                                   X: x,
                                   Y: y });
            }
        }
    }
    if (tilesPlaced.length == 7) {
        move.score += 50;
        console.log('all letters placed, 50 points bonus');
    }
    move.tilesPlaced = tilesPlaced;

    console.log('move score: ' + move.score);

    return move;
}

var letterDistributions = {
    'English':  [ { Letter: null, Score: 0, Count: 2},
		  
		  { Letter: "E", Score: 1, Count: 12},
		  { Letter: "A", Score: 1, Count: 9},
		  { Letter: "I", Score: 1, Count: 9},
		  { Letter: "O", Score: 1, Count: 8},
		  { Letter: "N", Score: 1, Count: 6},
		  { Letter: "R", Score: 1, Count: 6},
		  { Letter: "T", Score: 1, Count: 6},
		  { Letter: "L", Score: 1, Count: 4},
		  { Letter: "S", Score: 1, Count: 4},
		  { Letter: "U", Score: 1, Count: 4},
		  
		  { Letter: "D", Score: 2, Count: 4},
		  { Letter: "G", Score: 2, Count: 3},
		  
		  { Letter: "B", Score: 3, Count: 2},
		  { Letter: "C", Score: 3, Count: 2},
		  { Letter: "M", Score: 3, Count: 2},
		  { Letter: "P", Score: 3, Count: 2},
		  
		  { Letter: "F", Score: 4, Count: 2},
		  { Letter: "H", Score: 4, Count: 2},
		  { Letter: "V", Score: 4, Count: 2},
		  { Letter: "W", Score: 4, Count: 2},
		  { Letter: "Y", Score: 4, Count: 2},
		  
		  { Letter: "K", Score: 5, Count: 1},
		  
		  { Letter: "J", Score: 8, Count: 1},
		  { Letter: "X", Score: 8, Count: 1},
		  
		  { Letter: "Q", Score: 10, Count: 1},
		  { Letter: "Z", Score: 10, Count: 1}],
    'French': [ { Letter: null, Score: 0, Count: 2},
		
		{ Letter: "E", Score: 1, Count: 15},
		{ Letter: "A", Score: 1, Count: 9},
		{ Letter: "I", Score: 1, Count: 8},
		{ Letter: "N", Score: 1, Count: 6},
		{ Letter: "O", Score: 1, Count: 6},
		{ Letter: "R", Score: 1, Count: 6},
		{ Letter: "S", Score: 1, Count: 6},
		{ Letter: "T", Score: 1, Count: 6},
		{ Letter: "U", Score: 1, Count: 6},
		{ Letter: "L", Score: 1, Count: 5},
		
		{ Letter: "D", Score: 2, Count: 3},
		{ Letter: "G", Score: 2, Count: 2},
		{ Letter: "M", Score: 3, Count: 3},
		
		{ Letter: "B", Score: 3, Count: 2},
		{ Letter: "C", Score: 3, Count: 2},
		{ Letter: "P", Score: 3, Count: 2},
		
		{ Letter: "F", Score: 4, Count: 2},
		{ Letter: "H", Score: 4, Count: 2},
		{ Letter: "V", Score: 4, Count: 2},
		
		{ Letter: "J", Score: 8, Count: 1},
		{ Letter: "Q", Score: 8, Count: 1},

		{ Letter: "K", Score: 10, Count: 1},
		{ Letter: "W", Score: 10, Count: 1},
		{ Letter: "X", Score: 10, Count: 1},
		{ Letter: "Y", Score: 10, Count: 1},
		{ Letter: "Z", Score: 10, Count: 1}
	      ],
    'German': [ { Letter: null, Score: 0, Count: 2},
		
		{ Letter: "E", Score: 1, Count: 15},
		{ Letter: "N", Score: 1, Count: 9},
		{ Letter: "S", Score: 1, Count: 7},
		{ Letter: "I", Score: 1, Count: 6},
		{ Letter: "R", Score: 1, Count: 6},
		{ Letter: "T", Score: 1, Count: 6},
		{ Letter: "U", Score: 1, Count: 6},
		{ Letter: "A", Score: 1, Count: 5},
		{ Letter: "D", Score: 1, Count: 4},
		
		{ Letter: "H", Score: 2, Count: 4},
		{ Letter: "G", Score: 2, Count: 3},
		{ Letter: "L", Score: 2, Count: 3},
		{ Letter: "O", Score: 2, Count: 3},

		{ Letter: "M", Score: 3, Count: 4},
		{ Letter: "B", Score: 3, Count: 2},
		{ Letter: "W", Score: 3, Count: 1},
		{ Letter: "Z", Score: 3, Count: 1},
		
		{ Letter: "C", Score: 4, Count: 2},
		{ Letter: "F", Score: 4, Count: 2},
		{ Letter: "K", Score: 4, Count: 2},
		{ Letter: "P", Score: 4, Count: 1},
		
		{ Letter: "Ä", Score: 6, Count: 1},
		{ Letter: "J", Score: 6, Count: 1},
		{ Letter: "Ü", Score: 6, Count: 1},
		{ Letter: "V", Score: 6, Count: 1},

		{ Letter: "Ö", Score: 8, Count: 1},
		{ Letter: "X", Score: 8, Count: 1},

		{ Letter: "Q", Score: 10, Count: 1},
		{ Letter: "Y", Score: 10, Count: 1}]};

function type_of(obj) {
    if (typeof(obj) == 'object')
	if (typeof obj.length == "undefined" || !obj.length)
	    return 'object';
    else
	return 'array';
    else
	return typeof(obj);
}

var IDPrefix_Board_SquareOrTile = "BoardSquareOrTile_";
var IDPrefix_Rack_SquareOrTile = "RackSquareOrTile_";
var IDPrefix_Letters_SquareOrTile = "LettersSquareOrTile_";

function Tile(letter, score)
{
    this.Letter = letter;
    this.Score = score;
    this.Placed = false;
    
    this.isBlank = this.Letter == this.BlankLetter;
}

Tile.prototype.BlankLetter = "-";

Tile.prototype.toString = function() {
    return "Tile toString(): [" + this.Letter + "] --> " + this.Score;
}

SquareType = {
    Normal: 0,
    DoubleLetter: 1,
    DoubleWord: 2,
    TripleLetter: 3,
    TripleWord: 4
};

function Square(type) {
    this.Type = type;

    this.X = 0;
    this.Y = 0;

    this.Tile = null;
    this.TileLocked = false;
}

Square.prototype.PlaceTile = function(tile, locked) {
    if (this.Tile) {
	this.Tile.Placed = false;
    }

    this.Tile = tile;
    this.TileLocked = locked;

    if (tile) {
	if (tile.Placed) {
	    alert("Tile shouldn't already be placed on board or rack !! => " + tile);
	}
	tile.Placed = true;
    }
}

Square.prototype.toString = function() {
    return "Square toString(): " + this.Type;
}

function Board() {
    this.Squares = MakeBoardArray();
    this.Game = null;

    for (var y = 0; y < this.Dimension; y++) {
	for (var x = 0; x < this.Dimension; x++) {
	    var centerStart = false;

	    //SquareType.Normal, SquareType.DoubleLetter, SquareType.DoubleWord, SquareType.TripleLetter, SquareType.TripleWord
	    var square = new Square(SquareType.Normal);
	    
	    var middle = Math.floor(this.Dimension / 2);
	    var halfMiddle = Math.ceil(middle / 2);
	    
	    if ((x == 0 || x == this.Dimension - 1 || x == middle)
		&& (y == 0 || y == this.Dimension - 1 || y == middle && x != middle)) {
		square = new Square(SquareType.TripleWord);
	    } else if (x == middle && y == middle
		       || x > 0 && x < middle - 2 && (y == x || y == this.Dimension - x - 1)
		       || x > middle + 2 && x < this.Dimension - 1 && (x == y || x == this.Dimension - y - 1)) {
		square = new Square(SquareType.DoubleWord);
		if (x == middle && y == middle) {
		    centerStart = true;
		}
	    } else if ((x == middle - 1 || x == middle + 1)
		       && (y == middle - 1 || y == middle + 1)
		       || (x == 0 || x == this.Dimension - 1 || x == middle) && (y == middle + halfMiddle || y == middle - halfMiddle)
		       || (y == 0 || y == this.Dimension - 1 || y == middle) && (x == middle + halfMiddle || x == middle - halfMiddle)
		       || (y == middle + 1 || y == middle - 1) && (x == middle + halfMiddle + 1 || x == middle - halfMiddle - 1)
		       || (x == middle + 1 || x == middle - 1) && (y == middle + halfMiddle + 1 || y == middle - halfMiddle - 1)) {
		square = new Square(SquareType.DoubleLetter);
	    } else if ((x == middle - 2 || x == middle + 2)
		       && (y == middle - 2 || y == middle + 2)
		       || (y == middle + 2 || y == middle - 2) && (x == middle + halfMiddle + 2 || x == middle - halfMiddle - 2)
		       || (x == middle + 2 || x == middle - 2) && (y == middle + halfMiddle + 2 || y == middle - halfMiddle - 2)) {
		square = new Square(SquareType.TripleLetter);
	    }

	    square.X = x;
	    square.Y = y;
	    this.Squares[x][y] = square;
	}
    }

    triggerEvent('BoardReady', [ this ]);
}

Board.prototype.Dimension = 15;

Board.prototype.RemoveFreeTiles = function() {
    var tiles = [];
    
    for (var y = 0; y < this.Dimension; y++) {
	for (var x = 0; x < this.Dimension; x++) {
	    var square = this.Squares[x][y];
	    
	    if (square.Tile && !square.Tile.Locked) {
		tiles.push(square.Tile);
		
		square.PlaceTile(null, false);
		
		triggerEvent('BoardSquareTileChanged', [ this, square ]);
	    }
	}
    }
    
    return tiles;
}

Board.prototype.EmptyTiles = function() {
    for (var y = 0; y < this.Dimension; y++) {
	for (var x = 0; x < this.Dimension; x++) {
	    var square = this.Squares[x][y];
	    
	    square.PlaceTile(null, false);
	    
	    triggerEvent('BoardSquareTileChanged', [ this, square ]);
	}
    }
}

Board.prototype.MoveTile = function(tileXY, squareXY) {
    if (tileXY.y == -1 || squareXY.y == -1) {
	if (this.Game) {
	    this.Game.MoveTile(tileXY, squareXY);
	}
	
	return;
    }
    
    var square1 = this.Squares[tileXY.x][tileXY.y];
    var square2 = this.Squares[squareXY.x][squareXY.y];

    var tile = square1.Tile;
    square1.PlaceTile(null, false);
    square2.PlaceTile(tile, false);

    triggerEvent('BoardSquareTileChanged', [ this, square1 ]);
    triggerEvent('BoardSquareTileChanged', [ this, square2 ]);
}

Board.prototype.toString = function() {
    return "Board toString(): " + this.Dimension + " x " + this.Dimension;
}

function Rack () {
    this.Dimension = 8;
    this.Squares = [];
    this.Game = null;

    for (var x = 0; x < this.Dimension; x++) {
	var square = new Square(SquareType.Normal);
	square.X = x;
	square.Y = -1;
	this.Squares[x] = square;
    }

    triggerEvent('RackReady', [ this ]);
}

Rack.prototype.TakeTilesBack = function() {
    var freeTilesCount = 0;
    for (var x = 0; x < this.Dimension; x++) {
	var square = this.Squares[x];
	if (!square.Tile) {
	    freeTilesCount++;
	}
    }
    
    freeTilesCount--;
    if (freeTilesCount <= 0) return;
    
    var tiles = this.Game.Board.RemoveFreeTiles();
    var count = tiles.length;

    if (count > freeTilesCount) {
	count = freeTilesCount;
    }
    
    for (var i = 0; i < count; i++) {
	for (var x = 0; x < this.Dimension; x++) {
	    var square = this.Squares[x];
	    if (!square.Tile) {
		square.PlaceTile(tiles[i], false);

		triggerEvent('RackSquareTileChanged', [ this, square ]);
		
		break;
	    }
	}
    }
}

Rack.prototype.EmptyTiles = function() {
    for (var x = 0; x < this.Dimension; x++) {
	var square = this.Squares[x];
	
	square.PlaceTile(null, false);

	triggerEvent('RackSquareTileChanged', [ this, square ]);
    }
}

Rack.prototype.MoveTile = function(tileXY, squareXY) {
    if (tileXY.y != -1 || squareXY.y != -1) {
	if (this.Game) {
	    this.Game.MoveTile(tileXY, squareXY);
	}
	
	return;
    }
    
    var square1 = this.Squares[tileXY.x];
    var square2 = this.Squares[squareXY.x];

    var tile = square1.Tile;
    square1.PlaceTile(null, false);
    square2.PlaceTile(tile, false);

    triggerEvent('RackSquareTileChanged', [ this, square1 ]);
    triggerEvent('RackSquareTileChanged', [ this, square2 ]);
}

Rack.prototype.ReplenishRandomTiles = function() {
    var existingTiles = [];
    for (var x = 0; x < this.Dimension; x++) {
	var square = this.Squares[x];
	if (square.Tile) {
	    existingTiles.push(square.Tile);
	}
    }

    this.EmptyTiles();
    
    for (var x = 0; x < existingTiles.length; x++) {
	var square = this.Squares[x];
	square.PlaceTile(existingTiles[x], false);
	triggerEvent('RackSquareTileChanged', [ this, square ]);
    }
    
    for (var x = existingTiles.length; x < (this.Dimension-1); x++) {
	var square = this.Squares[x];
	
	var tile = this.Game.LetterBag.GetRandomTile();
	if (!tile) return;
	
	square.PlaceTile(tile, false);
	
	triggerEvent('RackSquareTileChanged', [ this, square ]);
    }
}

Rack.prototype.GenerateRandomTiles = function() {
    this.EmptyTiles();

    for (var x = 0; x < (this.Dimension - 1); x++) {
	var square = this.Squares[x];
	
	var tile = this.Game.LetterBag.GetRandomTile();
	if (!tile) return;
	
	square.PlaceTile(tile, false);
	
	triggerEvent('RackSquareTileChanged', [ this, square ]);
    }
    
    var square = this.Squares[this.Dimension - 1];
    if (square.Tile) {
	square.PlaceTile(null, false);
	
	triggerEvent('RackSquareTileChanged', [ this, square ]);
    }
}

Rack.prototype.toString = function() {
    return "Rack toString(): " + this.Dimension;
}

function LetterBag(language)
{
    this.Tiles = [];
    this.Letters = [];

    var data = letterDistributions[language];
    if (!data) {
        alert('unsupported language: ' + language);
    }
    for (var i = 0; i < data.length; ++i) {
	var item = data[i];
	
	var tile = new Tile(item.Letter || Tile.prototype.BlankLetter, item.Score);
	this.Letters.push(tile);
	
	for (var n = 0; n < item.Count; ++n) {
	    var tile = new Tile(item.Letter || Tile.prototype.BlankLetter, item.Score);
	    this.Tiles.push(tile);
	}
    }
    
    this.Letters.sort(function(a,b) {
	var a = a.Letter || Tile.prototype.BlankLetter;
	var b = b.Letter || Tile.prototype.BlankLetter;

	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
    });
}

LetterBag.prototype.Shake = function()
{
    var count = this.Tiles.length;
    for (i = 0; i < count * 3; i++) {
        var a = Math.floor(Math.random() * count);
        var b = Math.floor(Math.random() * count);
        var tmp = this.Tiles[b];
        this.Tiles[b] = this.Tiles[a];
        this.Tiles[a] = tmp;
    }
}

LetterBag.prototype.GetRandomTile = function()
{
    this.Shake();
    
    for (var i = 0; i < this.Tiles.length; i++) {
        if (!this.Tiles[i].Placed) {
            return this.Tiles[i];
        }
    }
    return null;
}

function Game(language, board, rack) {
    
    this.Board = board;
    board.Game = this;
    
    this.Rack = rack;
    rack.Game = this;

    this.Language = language;
    this.LetterBag = new LetterBag(language);
}

Game.prototype.MoveTile = function(tileXY, squareXY) {
    if (tileXY.y == -1 && squareXY.y == -1) {
	this.Rack.MoveTile(tileXY, squareXY);
	return;
    }
    
    if (tileXY.y != -1 && squareXY.y != -1) {
	this.Board.MoveTile(tileXY, squareXY);
	return;
    }

    // RACK to BOARD
    if (tileXY.y == -1) {
	var square1 = this.Rack.Squares[tileXY.x];
	var square2 = this.Board.Squares[squareXY.x][squareXY.y];
	
	var tile = square1.Tile;
	square1.PlaceTile(null, false);
	square2.PlaceTile(tile, false);

	triggerEvent('RackSquareTileChanged', [ this.Rack, square1 ]);
	triggerEvent('BoardSquareTileChanged', [ this.Board, square2 ]);
	
	return;
    }

    // BOARD to RACK
    if (squareXY.y == -1) {
	var square1 = this.Board.Squares[tileXY.x][tileXY.y];
	var square2 = this.Rack.Squares[squareXY.x];
	
	var tile = square1.Tile;
	square1.PlaceTile(null, false);
	square2.PlaceTile(tile, false);
	
	triggerEvent('BoardSquareTileChanged', [ this.Board, square1 ]);
	triggerEvent('RackSquareTileChanged', [ this.Rack, square2 ]);
	
	return;
    }
}

Game.prototype.CommitMove = function() {
    var move = calculateMove(this.Board.Squares);

    console.log('move committed', move);

    if (move.error) {
        console.log('error: ' + move.error);
        return;
    }

    this.Rack.Locked = true;

    for (var y = 0; y < this.Board.Dimension; y++) {
	for (var x = 0; x < this.Board.Dimension; x++) {
            var square = this.Board.Squares[x][y];
            if (square.Tile) {
                square.TileLocked = true;
            }
        }
    }

    triggerEvent('RefreshRack', [ this.Rack ]);
    triggerEvent('RefreshBoard', [ this.Board ]);
}

Game.prototype.OpenForMove = function() {
    this.Rack.Locked = false;
    triggerEvent('RefreshRack', [ this.Rack ]);
}
    

Game.prototype.toString = function() {
    return "Game toString(): TODO ... ";
}

if (typeof exports == 'object') {
    exports.Rack = Rack;
    exports.Board = Board;
    exports.Game = Game;
    exports.LetterBag = LetterBag;
}