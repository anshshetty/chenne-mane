# Game rules and sources

Chenne Mane has regional and family variations. This implementation follows one
four-shell coastal family game described by [Soumya](https://soumya-alteridem.blogspot.com/2011/07/chennemane.html)
and [Pallavi Shyam](https://havyakavishwa.com/banni-chennemaneli-ondu-aata-aduvo/).
It does not claim to be a universal rulebook.

## A turn

The board has two rows of seven pits, with four shells in each pit: 56 in total.
The two larger bowls hold captured shells and are not part of the sowing circuit.

1. Choose an occupied pit in your own row and pick up all its shells.
2. Sow anticlockwise, one shell into each following pit, crossing between rows.
   On the horizontal board, the bottom row runs right and the top row runs left.
3. After the last drop, inspect the next pit. If it contains shells, pick them up
   and continue sowing.
4. If that next pit is empty, capture the shells from the pit immediately beyond
   it and end the turn. If that pit is also empty, capture nothing.

Only the first pickup must come from your own row. Relay pickups and captures may
occur in either row. Four-shell groups do not automatically score, and opposite
pits are not captured in this variant.

## Finishing a round

After a completed turn, the round ends if the next player has no legal starting
pit. Remaining shells are credited to the owner of their row. The larger captured
total wins; equal totals draw. A row becoming empty during sowing does not end the
turn because later drops may refill it.

The same settlement applies when a complete position occurs three times, when a
relay repeats, or when a relay reaches its 20,000-drop safety limit. These are
explicit digital finishing rules that keep looping endgames finite. They are not
presented as traditional rules shared by every household.

A rematch restores four shells per pit. Traditional redistribution between rounds,
closed pits, and alternate capture variants are not implemented.

## Related accounts

These sources informed the comparison of variants and cultural context. Their
rules are not combined into the implemented game:

- [Peter J. Claus, Cenne (Mancala) in Tuluva Myth and Cult](https://www.ciil-ebooks.net/html/folklore2/ch9.htm),
  _Indian Folklore II_, 1987. Fieldwork on Tulu variants, including four-seed harvests.
- [CSSSC, Cenne Mane](https://www.indiaboardgamesarchive.in/omekas/s/ancientindianboardgames/item/6435),
  _Ancient Indian Boardgames: Digital Documentation_. Variant descriptions.
- [Shrikala Kowshik, Pits And Falls](https://kanarasaraswat.org/magazine/2020/06-20.pdf),
  _Kanara Saraswat_, June 2020, page 23. Family recollections with a different setup
  and harvest rule.
- [Mancala World, Ali Guli Mane](https://mancala.fandom.com/wiki/Ali_Guli_Mane).
  A five-seed version with different capture and multi-round rules.
- [Bead Game, How to play Ali Guli Mane](https://www.bead.game/games/traditional/ali-guli-mane).
  A publisher's instructions for its version.
- [Podiya and Prasad Kulkarni, Indigenous Folk Game Chennemane and Its Socio-Cultural Values](https://www.journalpressindia.com/gbs-impact-journal-of-multi-disciplinary-research/doi/v6i1.04),
  _GBS Impact_ 6(1), 2020, pages 11–15. A regional questionnaire and interview study.

Contributions describing other traditions should name the variant and its source,
including an oral account when appropriate.
