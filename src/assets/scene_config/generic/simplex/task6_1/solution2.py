import player

# если заметить, что мусорные баки летят каждые 3 хода,
# то можно прийти к следующему решению:

# подождать 1 ход, чтобы синхронизироваться с ходами,
# когда падают баки (это значение легко подобрать)
player.wait(1)

# повторить 15 раз по 2 шага
for i in range(15):
    # пропустить 1 ход, когда падает бак
    player.wait(1)
    # идти 2 клетки
    player.move(2)
    # такой шаг цикла занимает ровно 3 хода, что равно интервалу падения баков, потому
    # игрок всегда будет проходить между ними даже без проверок