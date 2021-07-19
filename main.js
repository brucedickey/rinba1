/* main.js
 *
 * The Rinba game. 
 * Copyright 2006, Bruce Allen Dickey, All Rights Reserved.
 */

// ----- Settings for jsHint: -----
// jshint esversion: 6
/* globals $ */
/* globals _ */

const CORNERS     = ['a1', 'a4', 'd1', 'd4'];
const NON_CORNERS = ['a3', 'a2', 'b4','b3', 'b2', 'b1', 'c4','c3', 'c2', 'c1', 'd3', 'd2'];
const ALL_SQUARES = ['a4', 'a3', 'a2', 'a1', 'b4','b3', 'b2', 'b1', 'c4','c3', 'c2', 'c1', 'd4', 'd3', 'd2', 'd1'];

const POTENTIAL_MOVES_LISTS = {
    'a1': [ ['a2','a3','a4'], ['b2','c3','d4'], ['b1','c1','d1'] ],
    'a2': [ ['a3','a4'],      ['b3','c4'],      ['b2','c2','d2'], ['b1'],      ['a1'] ],
    'a3': [ ['a4'],           ['b4'],           ['b3','c3','d3'], ['b2','c1'], ['a2','a1'] ],
    'a4': [ ['b4','c4','d4'], ['b3','c2','d1'], ['a3','a2','a1'] ],

    'b1': [ ['b2','b3','b4'], ['c2','d3'], ['c1','d1'],      ['a1'],      ['a2'] ],
    'b2': [ ['b3','b4'],      ['c3','d4'], ['c2','d2'],      ['c1'],      ['b1'],      ['a1'], ['a2'], ['a3'] ],
    'b3': [ ['b4'],           ['c4'],      ['c3','d3'],      ['c2','d1'], ['b2','b1'], ['a2'], ['a3'], ['a4'] ],
    'b4': [ ['c4','d4'],      ['c3','d2'], ['b3','b2','b1'], ['a3'],      ['a4'] ],

    'c1': [ ['c2','c3','c4'], ['d2'],      ['d1'],           ['b1','a1'], ['b2','a3'] ],
    'c2': [ ['c3','c4'],      ['d3'],      ['d2'],           ['d1'],      ['c1'],      ['b1'],      ['b2','a2'], ['b3','a4'] ],
    'c3': [ ['c4'],           ['d4'],      ['d3'],           ['d2'],      ['c2','c1'], ['b2','a1'], ['b3','a3'], ['b4'] ],
    'c4': [ ['d4'],           ['d3'],      ['c3','c2','c1'], ['b3','a2'], ['b4','a4'] ],

    'd1': [ ['d2','d3','d4'], ['c1','b1','a1'], ['c2','b3','a4'] ],
    'd2': [ ['d3','d4'],      ['d1'],           ['c1'],          ['c2','b2','a2'], ['c3','b4'] ],
    'd3': [ ['d4'],           ['d2','d1'],      ['c2','b1'],     ['c3','b3','a3'], ['c4'] ],
    'd4': [ ['d3','d2','d1'], ['c3','b2','a1'], ['c4','b4','a4'] ],                
};
const WIN_QUADRANTS = {         // For a win:
    0: ['a1','a2','b1','b2'],   // * Must have exactly 1 piece in these first 4 quadrants.
    1: ['a3','a4','b3','b4'],
    2: ['c1','c2','d1','d2'],
    3: ['c3','c4','d3','d4'],

    4: ['b2','b3','c2','c3'],   // * AND must not have more than one piece in these 5 quadrants.
    5: ['b3','b4','c3','c4'], 
    6: ['c2','c3','d2','d3'], 
    7: ['b1','b2','c1','c2'], 
    8: ['a2','a3','b2','b3']
};


// Players have sets of playing pieces identified by 'blu' (Blue) and 'ora' (Orange).
var move_list  = [];        // ["b4,a4", "c3,b4", ...]
var move_count = 0;         // Increment after both sides have moved.
var game_state = 'reset';   // Or 'playing', 'blu_won', 'ora_won'
var whose_turn = 'blu';
var src_square = '';
var dest_square = '';
var legal_dest_squares = [];
var board = {};

/* Envisioned for later...
var allowed_search_seconds = 60;
var allowed_search_moves   = 8;
*/

var init_vars = function() {
    move_list  = [];
    move_count = 0;          // Incremented after both sides have moved.
    game_state = 'reset';    // Or 'playing', 'blu_won', 'ora_won'.
    whose_turn = 'blu';      // Or 'ora'; names of playing piece sets.
    src_square = '';
    dest_square = '';
    legal_dest_squares = [];
    board = {}; 
};

//-------------------------------------------------------------------------
// EVENTS
$('#howto-button').click(function(e) {
    $('#howto-modal').modal('show');
});

/* Envisioned for later...
$('#settings-button').click(function(e) {
    $('#settings-modal').modal('show');
});  

$('#settings-save-button').click(function(e) {
    // TODO: add validation

    let hms = $('#search-time').val();
    let a = hms.split(':'); 
    if (a.length === 3) {
        allowed_search_seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]); 
    }
    else if (a.length === 2) {
        allowed_search_seconds = (+a[0]) * 60 + (+a[1]); 
    }
    else {
        allowed_search_seconds = (+a[0]); 
    }
    $('#search-time').attr('placeholder', allowed_search_seconds.toString()).val('').focus().blur();

    allowed_search_moves = parseInt( $('#look-ahead').val(), 10);
    $('#look-ahead').attr('placeholder', allowed_search_moves.toString()).val('').focus().blur();

    $('#settings-modal').modal('hide');
});
*/

$('#about-button').click(function(e) {
    $('#about-modal').modal('show');
}); 

$('.square').click(function(e) { 
    // Move the selected piece, if any, to the clicked square if it is a legal destination for the piece. 
    // Then switch the turn to the other player. 
    if (src_square !== '') {
        dest_square = e.currentTarget.id;

        if (legal_dest_squares.includes(dest_square)) {
            move_piece();          // Move current player's piece

            if (whose_turn === 'ora') {
                move_count += 1;   // Incrementing after BOTH sides have moved.
            }

            var win = check_for_win(board, whose_turn);             
            if (win) {
                // 'ora' has not moved yet, so increment move_count for 'blu' for the win notification.
                if (whose_turn === 'blu') {
                    move_count += 1;
                }
                announce_win();
            }
            else {
                whose_turn = (whose_turn === 'blu')? "ora": 'blu';

                // Tell the other player to move
                announce_next_turn();
            }
        }
        else {
            // Legal destination targets are shown when a piece is selected so no need 
            // to show a nasty-gram for attempting to move to an invalid place.
        }
    }
});

/* Envisioned for later...
$('#force-btn').click(function(e) {
    if (game_state === 'reset') {
        // Computer makes the first move of the game.
        computer_move();
    }
    else {
        // Send msg to game engine that it should now return its best move found so far. 
        // Randomly select amoung equals if no single best one is known.
    }
}); 
*/

$('#reset-btn').click(function(e) {
    // Game over; reset the game.
    reset();
}); 

var reset = function() {
    init_vars();
    init_board();
    set_blu_click_handler();
    set_ora_click_handler();
};

var set_blu_click_handler = function() {
    $('.blu').off().click(function(e) {
        // Select the clicked piece from the 'crc' set for moving. (Deselect on 2nd click.)
        e.stopPropagation();

        if ((whose_turn === 'blu') && ['reset', 'playing'].includes(game_state)) {
            let new_square = e.currentTarget.parentElement.id;

            if (src_square === '') {
                // Add selection
                src_square = new_square;
                $('#' + src_square + ' .fa-circle').removeClass('fa-circle').addClass('fa-plus-circle');
                legal_dest_squares = get_legal_dest_squares(board, src_square);
            }
            else if (src_square === new_square) {   // Clicked selected piece again
                // Remove selection
                $('#' + src_square + ' .fa-plus-circle').removeClass('fa-plus-circle').addClass('fa-circle');
                src_square = '';
                legal_dest_squares = [];
                remove_hints();
            }
            else if (src_square != new_square) {
                // Change selection to a different piece
                $('#' + src_square + ' .fa-plus-circle').removeClass('fa-plus-circle').addClass('fa-circle');
                remove_hints();

                src_square = new_square;
                $('#' + src_square + ' .fa-circle').removeClass('fa-circle').addClass('fa-plus-circle');
                legal_dest_squares = get_legal_dest_squares(board, src_square);
            }

            if (legal_dest_squares.length > 0) {
                place_dest_hints();
            }
        }
    });    
};

var set_ora_click_handler = function() {
    $('.ora').off().click(function(e) {
        // Select the clicked piece from the 'crc' set for moving. (Deselect on 2nd click.)
        e.stopPropagation();

        if ((whose_turn === 'ora') && ['reset', 'playing'].includes(game_state)) {
            let new_square = e.currentTarget.parentElement.id;

            if (src_square === '') {
                // Add selection
                src_square = new_square;
                $('#' + src_square + ' .fa-square').removeClass('fa-square').addClass('fa-plus-square');
                legal_dest_squares = get_legal_dest_squares(board, src_square);
            }
            else if (src_square === new_square) {   // Clicked selected piece again
                // Remove selection
                $('#' + src_square + ' .fa-plus-square').removeClass('fa-plus-square').addClass('fa-square');
                src_square = '';
                legal_dest_squares = [];
                remove_hints();
            }
            else if (src_square != new_square) {
                // Change selection to a different piece
                $('#' + src_square + ' .fa-plus-square').removeClass('fa-plus-square').addClass('fa-square');
                remove_hints();

                src_square = new_square;
                $('#' + src_square + ' .fa-square').removeClass('fa-square').addClass('fa-plus-square');
                legal_dest_squares = get_legal_dest_squares(board, src_square);
            }

            if (legal_dest_squares.length > 0) {
                place_dest_hints();
            }
        }
    });
};

var init_board = function() {
    // Removing and re-adding is simpler than scanning the board for pieces.
    // Removing requires re-adding event handlers afterwards.
    $('.blu').remove();
    $('.ora').remove();

    ['a4','a3', 'a2', 'a1', 'd4','d3', 'd2', 'd1'].forEach( (loc) => {
        $('#' + loc + ' label').removeClass('ref-populated').addClass('ref');
        board[loc] = '';   // Initially unoccupied
    });
    
    // Set up ora's pieces
    ['c4','c3', 'c2', 'c1'].forEach( (loc) => {place_piece('ora', loc)} );

    // Set up blu's pieces
    ['b4','b3', 'b2', 'b1'].forEach( (loc) => {place_piece('blu', loc)} );
};

var place_piece = function(whose_turn, loc) {
    // Put the piece on the destination square and adjust the square ID position
    if (whose_turn === 'blu') {
        $('#' + loc).append('<span class="blu fa fa-circle"></span>');
        set_blu_click_handler();
    }
    else if (whose_turn === 'ora') {
        $('#' + loc).append('<span class="ora fa fa-square"></span>');
        set_ora_click_handler();
    }
    $('#' + loc + ' label').removeClass('ref').addClass('ref-populated');

    // Set square to playing piece set.
    board[loc] = whose_turn;   
};

var place_dest_hints = function() {
    for (let loc of legal_dest_squares) {
        $('#' + loc).append('<span class="hint fa fa-bullseye"></span>');
        $('#' + loc + ' label').removeClass('ref').addClass('ref-populated');
    }
};

var remove_hints = function() {
    let keys = Object.keys(board);
    for (let square of keys) {
        if (board[square] === '') {
            $('#' + square + ' label').removeClass('ref-populated').addClass('ref');
            $('.hint').remove();
        }
    }
};

var move_piece = function() {
    // Remove the piece from the src square.
    $('#' + src_square + ' .fa').remove();
    board[src_square] = '';   // Indicate that the src square is now empty
    src_square = '';
    remove_hints();

    // Add the piece to the dest square.
    place_piece(whose_turn, dest_square);

    // Game house-keeping
    game_state = 'playing';
};

var get_legal_dest_squares = function(the_board, src_square) {   
    // Gets legal destination squares in all compass directions for the piece 
    // on the square passed in. 

    let these_legal_dest_squares = [];
    let potential_piece_moves_lists = POTENTIAL_MOVES_LISTS[src_square];

    for (let piece_moves_list of potential_piece_moves_lists) {
        // Now have a move list in one compass direction.
        var prev_empty_square = null;

        for (let square of piece_moves_list) {
            if (the_board[square] === '') {
                prev_empty_square = square;
            }
            else {
                break;
            }
        }

        if (prev_empty_square !== null) {
            // `prev_empty_square` is a destination candidate if it would not create an illegal corner position.

            if (is_legal_move(src_square, prev_empty_square, the_board)) {
                these_legal_dest_squares.push(prev_empty_square);
            }
        }
    }
    return these_legal_dest_squares;
};

var is_legal_move = function(src_square, dest_square, the_board) {
    // If dest square is any but a4, a1, d4, d1, then check that
    //  1) these corner squares are NOT empty and
    //  2) not ALL the other non corner squares are occupied by the current set
    if (NON_CORNERS.includes(dest_square)) {
        if (!is_legal_corner_move(['a2', 'b2', 'b1'], ['a1'], src_square, dest_square, the_board)) return false; 
        if (!is_legal_corner_move(['a3', 'b3', 'b4'], ['a4'], src_square, dest_square, the_board)) return false;
        if (!is_legal_corner_move(['d3', 'c3', 'c4'], ['d4'], src_square, dest_square, the_board)) return false;
        if (!is_legal_corner_move(['d2', 'c2', 'c1'], ['d1'], src_square, dest_square, the_board)) return false;
    }
    return true;
};

var is_legal_corner_move = function(surrounding_squares, corner_square, src_square, dest_square, the_board) {  
    let test_board = JSON.parse(JSON.stringify(the_board));
    test_board[src_square] = '';   // Piece would be moved off this square

    let is_legal = true;
    if (surrounding_squares.includes(dest_square) && (test_board[corner_square] === '') ) {

        let diffs = surrounding_squares.filter(x => ![dest_square].includes(x));

        if ( (test_board[diffs[0]] === whose_turn) && (test_board[diffs[1]] === whose_turn) ) {                
            is_legal = false;
        }
    }
    return is_legal;
};

var check_for_win = function(the_board, cur_whose_turn) {
    // Win == exactly one piece in each of the corner quadrants, and
    //        zero or one piece in each of the other sets of four squares in `WIN_QUADRANTS`.
    let win = true;
    let quadrants_keys = Object.keys(WIN_QUADRANTS);

    for (let i = 0; i < quadrants_keys.length; i++) {
        let quadrant_squares = WIN_QUADRANTS[quadrants_keys[i]];
        let count = 0;

        for (let j = 0; j < quadrant_squares.length; j++) {
            let square = quadrant_squares[j]; 
            if (the_board[square] === cur_whose_turn) {
                count += 1;
            }
        }
        if ((i < 4) && (count !== 1)) {
            win = false;
            break;
        }
        else if ((i >= 4) && (count > 1)) {
            win = false;
            break;                
        }
    }
    return win; 
};

var announce_win = function() {
    if (whose_turn === 'blu') {
        $('#notification-line1').html('Blue,');
        game_state = 'blu_won';
    }
    else {
        $('#notification-line1').html('Orange,');
        game_state = 'ora_won';
    }
    $('#notification-line2').html('you won in ' + move_count + ' moves!');
};

var announce_next_turn = function() {
    if (whose_turn === 'blu') {
        $('#notification-line1').html('Blue, it\'s your turn.');
    }
    else {
        $('#notification-line1').html('Orange, it\'s your turn.');
    }
    $('#notification-line2').html('Click piece then destination square.');
};    


$(document).ready(function(){
    reset();
});
