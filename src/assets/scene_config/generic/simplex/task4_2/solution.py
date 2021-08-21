import player

# получить относительные координаты письма
letter = player.find('letter')

# письмо правее - повернуть направо,
# пройти нужное расстояние, повернуть налево
if letter[0] > 0:
    player.right()
    player.move(letter[0])
    player.left()
# письмо левее - повернуть налево,
# пройти нужное расстояние, повернуть направо
elif letter[0] < 0:
    player.left()
    # letter[0] отрицательное - инвертировать знак
    player.move(-letter[0])
    player.right()

# письмо впереди - пройти вперед нужное расстояние
if letter[1] > 0:
    player.move(letter[1])
# письмо сзади - развернуться и пройти нужное расстояние
elif letter[1] < 0:
    player.right()
    player.right()
    player.move(-letter[1])

# подобрать письмо
player.pickup('letter')